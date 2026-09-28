package com.example.demo.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.Lote;
import com.example.demo.model.Solicitacao;
import com.example.demo.model.Usuario;
import com.example.demo.repository.LoteRepository;
import com.example.demo.repository.SolicitacaoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.PdfService;
import com.example.demo.service.PinService;

import jakarta.servlet.http.HttpSession;

@Controller
public class IndustriaController {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private SolicitacaoRepository solicitacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PdfService pdfService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PinService pinService;

    // =========================================================
    // PÁGINA INICIAL
    // =========================================================

    @GetMapping("/")
    public String index(Model model) {

        List<Solicitacao> retiradas = solicitacaoRepository.findByStatus("RETIRADA");

        double totalKg = retiradas.stream()
                .mapToDouble(s -> s.getQuantidadeSolicitada() != null ? s.getQuantidadeSolicitada() : 0.0)
                .sum();

        int totalEntregas = retiradas.size();

        model.addAttribute("totalKgDesviados", totalKg);
        model.addAttribute("totalEntregas", totalEntregas);

        return "index";
    }

    // =========================================================
    // DASHBOARD DA INDÚSTRIA
    // =========================================================

    @GetMapping("/industria")
    public String industria(Model model, HttpSession session) {

        Usuario usuarioSessao = (Usuario) session.getAttribute("usuarioLogado");

        if (usuarioSessao == null) {
            return "redirect:/login";
        }

        Usuario usuarioLogado = usuarioRepository
                .findById(usuarioSessao.getId())
                .orElse(usuarioSessao);

        List<Solicitacao> retiradasDaIndustria = solicitacaoRepository
                .findByStatus("RETIRADA")
                .stream()
                .filter(s -> s.getLote() != null
                        && s.getLote().getIndustria() != null
                        && s.getLote().getIndustria().getId().equals(usuarioLogado.getId()))
                .collect(Collectors.toList());

        double kgDesviados = retiradasDaIndustria.stream()
                .mapToDouble(s -> s.getQuantidadeSolicitada() != null
                        ? s.getQuantidadeSolicitada()
                        : 0.0)
                .sum();

        usuarioLogado.setKgDesviados(kgDesviados);
        usuarioLogado.setEntregasRealizadas(retiradasDaIndustria.size());

        session.setAttribute("usuarioLogado", usuarioLogado);
        model.addAttribute("usuarioLogado", usuarioLogado);
        model.addAttribute("demoMode", Boolean.TRUE.equals(session.getAttribute("demoMode")));
        model.addAttribute("demoPerfil", usuarioLogado.getTipo());

        // =====================================================
        // MEUS LOTES
        // =====================================================

        List<Lote> lotes = loteRepository.findByIndustria(usuarioLogado);

        // Lotes totalmente finalizados deixam de aparecer em "Meus lotes".
        // Se ainda houver uma solicitação ativa/reservada, o lote continua
        // visível para acompanhamento.
        List<Lote> lotesVisiveis = lotes.stream()
                .filter(lote -> {
                    if (lote.getPeso() != null && lote.getPeso() > 0.0) {
                        return true;
                    }
                    return solicitacaoRepository.findByLote_Industria(usuarioLogado).stream()
                            .anyMatch(s -> s.getLote() != null
                                    && s.getLote().getId().equals(lote.getId())
                                    && ("PENDENTE".equalsIgnoreCase(s.getStatus())
                                            || "ACEITA".equalsIgnoreCase(s.getStatus())));
                })
                .collect(Collectors.toCollection(ArrayList::new));

        lotesVisiveis.sort(Comparator.comparing(
                Lote::getId, Comparator.nullsLast(Comparator.reverseOrder())));

        model.addAttribute("lotes", lotesVisiveis);

        // =====================================================
        // SOLICITAÇÕES
        // =====================================================

        List<Solicitacao> solicitacoes = solicitacaoRepository
                .findByLote_Industria(usuarioLogado);

        // Ordem da tela:
        // 1. novas solicitações para aceitar/recusar;
        // 2. solicitações prontas para retirada (PIN);
        // 3. vendas aguardando pagamento;
        // 4. retiradas, das mais recentes para as mais antigas;
        // 5. demais encerradas.
        solicitacoes.sort(
                Comparator.comparingInt(this::prioridadeSolicitacaoIndustria)
                        .thenComparing(
                                this::dataOrdenacaoSolicitacao,
                                Comparator.nullsLast(Comparator.reverseOrder())));

        List<Solicitacao> solicitacoesLimitadas = new ArrayList<>();
        int contadorFinalizadas = 0;

        for (Solicitacao solicitacao : solicitacoes) {

            boolean finalizada = "RETIRADA".equalsIgnoreCase(solicitacao.getStatus())
                    || "RECUSADA".equalsIgnoreCase(solicitacao.getStatus())
                    || "CANCELADA".equalsIgnoreCase(solicitacao.getStatus());

            if (finalizada) {
                if (contadorFinalizadas < 5) {
                    solicitacoesLimitadas.add(solicitacao);
                    contadorFinalizadas++;
                }
            } else {
                solicitacoesLimitadas.add(solicitacao);
            }
        }

        model.addAttribute(
                "solicitacoes",
                solicitacoesLimitadas);

        model.addAttribute("lote", new Lote());

        return "dashboard-industria";
    }

    // =========================================================
    // PRIORIDADE DAS SOLICITAÇÕES
    // =========================================================

    private int prioridadeSolicitacaoIndustria(Solicitacao solicitacao) {

        if (solicitacao == null) {
            return 99;
        }

        String status = solicitacao.getStatus();

        if ("PENDENTE".equalsIgnoreCase(status)) {
            return 1;
        }

        if ("ACEITA".equalsIgnoreCase(status)) {

            // Doação: não existe pagamento, então o PIN já pode ser usado.
            if (solicitacao.getLote() != null
                    && "doacao".equalsIgnoreCase(
                            solicitacao.getLote().getFinalidade())) {
                return 2;
            }

            // Venda paga: pronta para retirada.
            if (solicitacao.isPagamentoConfirmado()) {
                return 2;
            }

            // Venda aceita, mas ainda sem pagamento.
            return 3;
        }

        if ("RETIRADA".equalsIgnoreCase(status)) {
            return 4;
        }

        if ("RECUSADA".equalsIgnoreCase(status)
                || "CANCELADA".equalsIgnoreCase(status)) {
            return 5;
        }

        return 99;
    }

    private java.time.LocalDateTime dataOrdenacaoSolicitacao(
            Solicitacao solicitacao) {

        if (solicitacao == null) {
            return null;
        }

        if (solicitacao.getDataRetirada() != null) {
            return solicitacao.getDataRetirada();
        }

        return solicitacao.getDataSolicitacao();
    }

    // =========================================================
    // CADASTRAR NOVO LOTE
    // =========================================================

    @PostMapping("/lotes")
    public String salvarLote(

            @RequestParam("tipoTecido") String tipoTecido,

            @RequestParam("peso") Double peso,

            @RequestParam("finalidade") String finalidade,

            @RequestParam(value = "temMarca", defaultValue = "false") boolean temMarca,

            @RequestParam(value = "preco", required = false) Double preco,

            @RequestParam(value = "arquivoImagem", required = false) MultipartFile arquivoImagem,

            HttpSession session) throws Exception {

        Usuario usuarioSessao = (Usuario) session.getAttribute(
                "usuarioLogado");

        if (usuarioSessao == null) {
            return "redirect:/login";
        }

        Usuario industria = usuarioRepository.findById(
                usuarioSessao.getId())
                .orElse(null);

        if (industria == null) {
            session.invalidate();
            return "redirect:/login";
        }

        if (tipoTecido == null
                || tipoTecido.trim().isEmpty()) {

            return "redirect:/industria?erro=tecido";
        }

        if (peso == null || peso <= 0) {
            return "redirect:/industria?erro=peso";
        }

        if (!"doacao".equalsIgnoreCase(finalidade)
                && !"venda".equalsIgnoreCase(finalidade)) {

            return "redirect:/industria?erro=finalidade";
        }

        Lote lote = new Lote();

        lote.setTipoTecido(tipoTecido.trim());

        lote.setPeso(peso);

        lote.setPesoInicial(peso);

        lote.setFinalidade(
                finalidade.trim().toLowerCase());

        lote.setTemMarca(temMarca);

        lote.setStatus("Disponível");

        lote.setIndustria(industria);

        // =====================================================
        // PREÇO
        // =====================================================

        if ("venda".equalsIgnoreCase(finalidade)) {

            if (preco == null || preco <= 0) {
                return "redirect:/industria?erro=preco";
            }

            lote.setPreco(preco);
            lote.setPrecoInicial(preco);

        } else {

            lote.setPreco(null);
            lote.setPrecoInicial(null);
        }

        // =====================================================
        // UPLOAD DA IMAGEM
        // =====================================================

        if (arquivoImagem != null
                && !arquivoImagem.isEmpty()) {

            String tipo = arquivoImagem.getContentType();

            boolean imagemValida = "image/jpeg".equalsIgnoreCase(tipo)
                    ||
                    "image/png".equalsIgnoreCase(tipo)
                    ||
                    "image/webp".equalsIgnoreCase(tipo);

            if (!imagemValida) {
                return "redirect:/industria?erro=imagem";
            }

            String nomeOriginal = arquivoImagem.getOriginalFilename();

            String extensao = "";

            if (nomeOriginal != null
                    && nomeOriginal.contains(".")) {

                extensao = nomeOriginal
                        .substring(
                                nomeOriginal.lastIndexOf("."))
                        .toLowerCase();
            }

            String nomeArquivo = UUID.randomUUID() + extensao;

            File pastaUploads = new File(
                    System.getProperty("texciclo.upload-dir", "uploads"));

            if (!pastaUploads.exists()) {
                pastaUploads.mkdirs();
            }

            File arquivo = new File(
                    pastaUploads,
                    nomeArquivo);

            arquivoImagem.transferTo(arquivo);

            lote.setImagem(nomeArquivo);
        }

        // =====================================================
        // SALVA O LOTE
        // =====================================================

        Lote loteSalvo = loteRepository.save(lote);

        // =====================================================
        // GERA PDF DE COMPROMISSO
        // =====================================================

        if (loteSalvo.isTemMarca()) {

            try {

                String pdf = pdfService
                        .gerarCompromissoCadastro(
                                loteSalvo);

                loteSalvo.setPdfCompromisso(pdf);

                loteRepository.save(loteSalvo);

            } catch (Exception e) {

                e.printStackTrace();

                return "redirect:/industria?sucesso=lote&erro=pdf";
            }
        }

        return "redirect:/industria?sucesso=lote";
    }

    // =========================================================
    // CONFIRMAR RETIRADA
    // =========================================================

    @PostMapping("/solicitacoes/retirar/{id}")
    public String confirmarRetirada(

            @PathVariable Long id,

            @RequestParam("pin") String pinDigitado,

            HttpSession session) {

        // =====================================================
        // VERIFICA LOGIN
        // =====================================================

        Usuario usuarioSessao = (Usuario) session.getAttribute(
                "usuarioLogado");

        if (usuarioSessao == null) {
            return "redirect:/login";
        }

        // =====================================================
        // BUSCA SOLICITAÇÃO
        // =====================================================

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        // =====================================================
        // VERIFICA PAGAMENTO DA VENDA
        // =====================================================

        if (solicitacao != null
                && solicitacao.getLote() != null
                && "venda".equalsIgnoreCase(
                        solicitacao.getLote().getFinalidade())
                && !"PAGO".equalsIgnoreCase(
                        solicitacao.getPagamentoStatus())) {

            return "redirect:/industria?erro=pagamento&aba=solicitacoes";
        }

        if (solicitacao == null
                || solicitacao.getLote() == null) {

            return "redirect:/industria?erro=solicitacao&aba=solicitacoes";
        }

        // =====================================================
        // BUSCA LOTE
        // =====================================================

        Lote lote = solicitacao.getLote();

        Usuario industria = lote.getIndustria();

        // =====================================================
        // VERIFICA PERMISSÃO
        // =====================================================

        if (industria == null
                || industria.getId() == null
                || !industria.getId()
                        .equals(usuarioSessao.getId())) {

            return "redirect:/industria?erro=permissao&aba=solicitacoes";
        }

        // =====================================================
        // SOMENTE ACEITA
        // =====================================================

        if (!"ACEITA".equalsIgnoreCase(
                solicitacao.getStatus())) {

            return "redirect:/industria?erro=solicitacao&aba=solicitacoes";
        }

        // =====================================================
        // VENDA: O PAGAMENTO PRECISA ESTAR CONFIRMADO
        // =====================================================

        if ("venda".equalsIgnoreCase(lote.getFinalidade())
                && !solicitacao.isPagamentoConfirmado()) {

            return "redirect:/industria?erro=pagamento&aba=solicitacoes";
        }

        // =====================================================
        // VALIDA PIN
        // =====================================================

        String pinCorreto = solicitacao.getPinRetirada();

        if (pinCorreto == null
                || pinDigitado == null
                || !pinCorreto.trim()
                        .equals(pinDigitado.trim())) {

            return "redirect:/industria?erro=pin&aba=solicitacoes&solicitacao="
                    + id;
        }

        // =====================================================
        // QUANTIDADE RETIRADA
        // =====================================================

        double quantidadeRetirada = solicitacao.getQuantidadeSolicitada() != null
                ? solicitacao
                        .getQuantidadeSolicitada()
                : 0.0;

        if (quantidadeRetirada <= 0) {

            return "redirect:/industria?erro=quantidade&aba=solicitacoes";
        }

        // =====================================================
        // RETIRADA CONFIRMADA
        // =====================================================

        boolean estoqueJaReservado = solicitacao.isReservaAtiva();

        double pesoAtual = lote.getPeso() != null
                ? lote.getPeso()
                : 0.0;

        /*
         * Nas solicitações novas, o estoque já foi descontado no momento
         * da aprovação. Portanto, a retirada não desconta novamente.
         *
         * Para registros antigos, que ainda não tenham reservaAtiva,
         * mantemos a compatibilidade com o comportamento anterior.
         */
        if (!estoqueJaReservado && quantidadeRetirada > pesoAtual) {
            return "redirect:/industria?erro=pesolote&aba=solicitacoes";
        }

        solicitacao.setStatus("RETIRADA");
        solicitacao.setDataRetirada(java.time.LocalDateTime.now());
        solicitacao.setReservaAtiva(false);

        solicitacaoRepository.save(solicitacao);

        if (!estoqueJaReservado) {

            double novoPeso = pesoAtual - quantidadeRetirada;

            if (novoPeso < 0.001) {
                novoPeso = 0.0;
            }

            lote.setPeso(novoPeso);
        }

        /*
         * Se não houver mais saldo, o lote deixa de aparecer na vitrine.
         * O saldo já considera as reservas aprovadas.
         */
        atualizarStatusLotePorRetiradas(lote);

        loteRepository.save(lote);

        // =====================================================
        // ATUALIZA INDICADORES DA INDÚSTRIA
        // =====================================================

        double kgAtual = industria.getKgDesviados() != null
                ? industria.getKgDesviados()
                : 0.0;

        int entregasAtual = industria.getEntregasRealizadas() != null
                ? industria.getEntregasRealizadas()
                : 0;

        industria.setKgDesviados(
                kgAtual + quantidadeRetirada);

        industria.setEntregasRealizadas(
                entregasAtual + 1);

        usuarioRepository.save(industria);

        // =====================================================
        // RETORNO
        // =====================================================

        if (Boolean.TRUE.equals(session.getAttribute("demoMode"))) {
            session.setAttribute("demo.concluido", true);
            return "redirect:/teste-perfis?concluido=true";
        }

        return "redirect:/industria?sucesso=retirada";
    }

    // =========================================================
    // ACEITAR SOLICITAÇÃO
    // =========================================================

    @GetMapping("/solicitacoes/aceitar/{id}")
    public synchronized String aceitarSolicitacao(
            @PathVariable Long id,
            HttpSession session) {

        Usuario industria = (Usuario) session.getAttribute("usuarioLogado");

        if (industria == null) {
            return "redirect:/login";
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (solicitacao == null
                || solicitacao.getLote() == null) {

            return "redirect:/industria?erro=solicitacao&aba=solicitacoes";
        }

        if (solicitacao.getLote().getIndustria() == null
                || !solicitacao.getLote().getIndustria().getId()
                        .equals(industria.getId())) {

            return "redirect:/industria?erro=permissao&aba=solicitacoes";
        }

        if (!"PENDENTE".equalsIgnoreCase(
                solicitacao.getStatus())) {

            return "redirect:/industria?aba=solicitacoes";
        }

        Lote lote = solicitacao.getLote();

        double quantidade = solicitacao.getQuantidadeSolicitada() != null
                ? solicitacao.getQuantidadeSolicitada()
                : (lote.getPeso() != null
                        ? lote.getPeso()
                        : 0);

        if (lote.getPeso() == null
                || lote.getPeso() < quantidade) {

            return "redirect:/industria?erro=saldoinsuficiente&aba=solicitacoes";
        }

        // =====================================================
        // GERA O PDF ANTES DE RESERVAR O ESTOQUE
        // =====================================================

        try {

            String pdf = pdfService.gerarCompromisso(
                    lote,
                    solicitacao.getSolicitante());

            solicitacao.setPdfCompromisso(pdf);

        } catch (Exception e) {

            e.printStackTrace();

            return "redirect:/industria?erro=documento&aba=solicitacoes";
        }

        // =====================================================
        // ACEITA A SOLICITAÇÃO
        // =====================================================
        // O estoque já foi reservado quando a solicitação foi criada.
        // Portanto, aceitar NÃO pode descontar a quantidade novamente.
        // Mantemos uma compatibilidade para registros antigos sem reserva.
        // =====================================================

        if (!solicitacao.isReservaAtiva()) {
            double pesoAtual = lote.getPeso() != null ? lote.getPeso() : 0.0;

            if (pesoAtual < quantidade) {
                return "redirect:/industria?erro=saldoinsuficiente&aba=solicitacoes";
            }

            double novoPeso = pesoAtual - quantidade;
            if (novoPeso < 0.001) {
                novoPeso = 0.0;
            }
            lote.setPeso(novoPeso);
            solicitacao.setReservaAtiva(true);
        }

        solicitacao.setStatus("ACEITA");

        // Doação não precisa de pagamento: libera o PIN na aprovação.
        if ("doacao".equalsIgnoreCase(lote.getFinalidade())
                && (solicitacao.getPinRetirada() == null
                        || solicitacao.getPinRetirada().isBlank())) {

            String pin = pinService.gerarPin();
            solicitacao.setPinRetirada(pin);

            try {
                if (solicitacao.getSolicitante() != null
                        && solicitacao.getSolicitante().getEmail() != null
                        && !solicitacao.getSolicitante().getEmail().isBlank()) {

                    emailService.enviarPin(
                            solicitacao.getSolicitante().getEmail(),
                            lote.getTipoTecido(),
                            pin);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        atualizarStatusLotePorRetiradas(lote);
        loteRepository.save(lote);
        solicitacaoRepository.save(solicitacao);

        return "redirect:/industria?sucesso=aceita&aba=solicitacoes";
    }

    // =========================================================
    // INFORMAÇÕES DA ORGANIZAÇÃO SOLICITANTE
    // =========================================================

    @GetMapping("/solicitacoes/{id}/organizacao")
    public String visualizarOrganizacaoSolicitante(
            @PathVariable Long id,
            Model model,
            HttpSession session) {

        Usuario usuarioSessao = (Usuario) session
                .getAttribute("usuarioLogado");

        if (usuarioSessao == null) {
            return "redirect:/login";
        }

        if (!"INDUSTRIA".equalsIgnoreCase(
                usuarioSessao.getTipo())) {

            return redirecionarParaDashboard(usuarioSessao);
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (solicitacao == null
                || solicitacao.getLote() == null
                || solicitacao.getSolicitante() == null) {

            return "redirect:/industria?erro=solicitacao&aba=solicitacoes";
        }

        Usuario industria = solicitacao
                .getLote()
                .getIndustria();

        if (industria == null
                || industria.getId() == null
                || !industria.getId()
                        .equals(usuarioSessao.getId())) {

            return "redirect:/industria?erro=permissao&aba=solicitacoes";
        }

        if (!solicitacao.isComunicacaoAtiva()) {

            return "redirect:/industria?erro=comunicacao-expirada&aba=solicitacoes";
        }

        model.addAttribute(
                "solicitacao",
                solicitacao);

        model.addAttribute(
                "organizacao",
                solicitacao.getSolicitante());

        return "solicitacao-organizacao";
    }

    // =========================================================
    // RECUSAR SOLICITAÇÃO
    // =========================================================

    private String redirecionarParaDashboard(
            Usuario usuarioSessao) {

        if (usuarioSessao == null || usuarioSessao.getTipo() == null) {
            return "redirect:/login";
        }

        if ("INDUSTRIA".equalsIgnoreCase(usuarioSessao.getTipo())) {
            return "redirect:/industria";
        }

        if ("ONG".equalsIgnoreCase(usuarioSessao.getTipo())) {
            return "redirect:/ong";
        }

        if ("MICROEMPRESA".equalsIgnoreCase(usuarioSessao.getTipo())) {
            return "redirect:/microempresa";
        }

        return "redirect:/login";
    }

    @GetMapping("/solicitacoes/recusar/{id}")
    public String recusarSolicitacao(
            @PathVariable Long id) {

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (solicitacao != null
                && "PENDENTE".equalsIgnoreCase(
                        solicitacao.getStatus())) {

            solicitacao.setStatus("RECUSADA");

            solicitacaoRepository.save(solicitacao);
        }

        return "redirect:/industria?aba=solicitacoes";
    }

    private void atualizarStatusLotePorRetiradas(Lote lote) {
        if (lote == null || lote.getId() == null) {
            return;
        }

        long aguardando = solicitacaoRepository.findByLote_Industria(lote.getIndustria())
                .stream()
                .filter(s -> s.getLote() != null
                        && lote.getId().equals(s.getLote().getId()))
                .filter(s -> "ACEITA".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getPinRetirada() != null && !s.getPinRetirada().isBlank())
                .count();

        if (aguardando > 0) {
            lote.setStatus(aguardando == 1 ? "Aguardando retirada" : "Aguardando retiradas");
        } else {
            lote.setStatus("Disponível");
        }
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    @GetMapping("/logout")
    public String logout(HttpSession session) {

        session.invalidate();

        return "redirect:/login";
    }
}