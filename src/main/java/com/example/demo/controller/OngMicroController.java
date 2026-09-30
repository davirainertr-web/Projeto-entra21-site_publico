package com.example.demo.controller;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.model.Lote;
import com.example.demo.model.Solicitacao;
import com.example.demo.model.Usuario;
import com.example.demo.repository.LoteRepository;
import com.example.demo.repository.SolicitacaoRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.PinService;

import jakarta.servlet.http.HttpSession;

@Controller
public class OngMicroController {

        @Autowired
        private LoteRepository loteRepository;

        @Autowired
        private SolicitacaoRepository solicitacaoRepository;

        @Autowired
        private EmailService emailService;

        @Autowired
        private PinService pinService;


        @GetMapping("/ong")
        public String ong(
                        Model model,
                        HttpSession session) {

                Usuario usuarioLogado = (Usuario) session.getAttribute("usuarioLogado");

                if (usuarioLogado == null) {
                        return "redirect:/login";
                }

                // A demonstração pública usa somente o localStorage do navegador.
                if (Boolean.TRUE.equals(session.getAttribute("demoMode"))) {
                        model.addAttribute("usuarioLogado", usuarioLogado);
                        model.addAttribute("lotes", new ArrayList<Lote>());
                        model.addAttribute("minhasSolicitacoes", new ArrayList<Solicitacao>());
                        model.addAttribute("loteIdsSolicitados", new java.util.HashSet<Long>());
                        model.addAttribute("solicitacoesAtivasPorLote", new java.util.HashMap<Long, Solicitacao>());
                        model.addAttribute("demoMode", true);
                        model.addAttribute("demoPerfil", usuarioLogado.getTipo());
                        return "dashboard-ong";
                }

                if (!"ONG".equalsIgnoreCase(usuarioLogado.getTipo())) {
                        return redirecionarParaDashboard(usuarioLogado);
                }

                return carregarDashboard(
                                model,
                                usuarioLogado,
                                "doacao",
                                "dashboard-ong",
                                Boolean.TRUE.equals(session.getAttribute("demoMode")));
        }

        @GetMapping("/microempresa")
        public String microempresa(
                        Model model,
                        HttpSession session) {

                Usuario usuarioLogado = (Usuario) session.getAttribute("usuarioLogado");

                if (usuarioLogado == null) {
                        return "redirect:/login";
                }

                // A demonstração pública usa somente o localStorage do navegador.
                if (Boolean.TRUE.equals(session.getAttribute("demoMode"))) {
                        model.addAttribute("usuarioLogado", usuarioLogado);
                        model.addAttribute("lotes", new ArrayList<Lote>());
                        model.addAttribute("minhasSolicitacoes", new ArrayList<Solicitacao>());
                        model.addAttribute("loteIdsSolicitados", new java.util.HashSet<Long>());
                        model.addAttribute("solicitacoesAtivasPorLote", new java.util.HashMap<Long, Solicitacao>());
                        model.addAttribute("demoMode", true);
                        model.addAttribute("demoPerfil", usuarioLogado.getTipo());
                        return "dashboard-microempresa";
                }

                if (!"MICROEMPRESA".equalsIgnoreCase(usuarioLogado.getTipo())) {
                        return redirecionarParaDashboard(usuarioLogado);
                }

                return carregarDashboard(
                                model,
                                usuarioLogado,
                                "venda",
                                "dashboard-microempresa",
                                Boolean.TRUE.equals(session.getAttribute("demoMode")));
        }

        private String carregarDashboard(
                        Model model,
                        Usuario usuarioLogado,
                        String finalidade,
                        String pagina,
                        boolean modoDemo) {

                List<Solicitacao> minhasSolicitacoes = new ArrayList<>(
                                solicitacaoRepository.findBySolicitante(usuarioLogado));

                // Doações não têm pagamento. Para solicitações antigas que foram
                // aceitas antes da criação do PIN, garantimos o PIN agora.
                if ("doacao".equalsIgnoreCase(finalidade)) {
                        garantirPinsDeDoacao(minhasSolicitacoes);
                }

                // A ordem da tela depende do perfil.
                Comparator<Solicitacao> comparador;

                if ("venda".equalsIgnoreCase(finalidade)) {
                        comparador = Comparator
                                        .comparingInt(this::prioridadeMicroempresa)
                                        .thenComparing(
                                                        this::dataOrdenacao,
                                                        Comparator.nullsLast(Comparator.reverseOrder()));
                } else {
                        comparador = Comparator
                                        .comparingInt(this::prioridadeOng)
                                        .thenComparing(
                                                        this::dataOrdenacao,
                                                        Comparator.nullsLast(Comparator.reverseOrder()));
                }

                minhasSolicitacoes.sort(comparador);

                // Mantemos na vitrine os lotes disponíveis e também os lotes
                // que o próprio usuário acabou de solicitar. Assim o botão
                // "Cancelar solicitação" aparece dentro do próprio lote.
                Set<Long> loteIdsSolicitados = minhasSolicitacoes.stream()
                                .filter(s -> s.getLote() != null && s.getLote().getId() != null)
                                .filter(s -> "PENDENTE".equalsIgnoreCase(s.getStatus())
                                                || "ACEITA".equalsIgnoreCase(s.getStatus()))
                                .map(s -> s.getLote().getId())
                                .collect(Collectors.toSet());

                java.util.Map<Long, Solicitacao> solicitacoesAtivasPorLote =
                                minhasSolicitacoes.stream()
                                                .filter(s -> s.getLote() != null && s.getLote().getId() != null)
                                                .filter(s -> "PENDENTE".equalsIgnoreCase(s.getStatus())
                                                                || "ACEITA".equalsIgnoreCase(s.getStatus()))
                                                .collect(Collectors.toMap(
                                                                s -> s.getLote().getId(),
                                                                s -> s,
                                                                (primeira, segunda) -> segunda));

                List<Lote> lotes = buscarLotesVitrine(finalidade, loteIdsSolicitados, modoDemo);

                // Não acumulamos infinitamente solicitações encerradas.
                List<Solicitacao> solicitacoesLimitadas = limitarFinalizadas(
                                minhasSolicitacoes);

                model.addAttribute("usuarioLogado", usuarioLogado);
                model.addAttribute("lotes", lotes);
                model.addAttribute("minhasSolicitacoes", solicitacoesLimitadas);
                model.addAttribute("loteIdsSolicitados", loteIdsSolicitados);
                model.addAttribute("solicitacoesAtivasPorLote", solicitacoesAtivasPorLote);
                model.addAttribute("demoMode", modoDemo);
                model.addAttribute("demoPerfil", usuarioLogado.getTipo());

                return pagina;
        }

        private List<Solicitacao> limitarFinalizadas(
                        List<Solicitacao> solicitacoes) {

                List<Solicitacao> resultado = new ArrayList<>();
                int finalizadas = 0;

                for (Solicitacao s : solicitacoes) {
                        boolean encerrada = "RETIRADA".equalsIgnoreCase(s.getStatus())
                                        || "RECUSADA".equalsIgnoreCase(s.getStatus())
                                        || "CANCELADA".equalsIgnoreCase(s.getStatus());

                        if (encerrada) {
                                if (finalizadas < 5) {
                                        resultado.add(s);
                                        finalizadas++;
                                }
                        } else {
                                resultado.add(s);
                        }
                }

                return resultado;
        }

        private void garantirPinsDeDoacao(
                        List<Solicitacao> solicitacoes) {

                for (Solicitacao solicitacao : solicitacoes) {

                        if (!"ACEITA".equalsIgnoreCase(solicitacao.getStatus())
                                        || solicitacao.getLote() == null
                                        || !"doacao".equalsIgnoreCase(
                                                        solicitacao.getLote().getFinalidade())
                                        || (solicitacao.getPinRetirada() != null
                                                        && !solicitacao.getPinRetirada().isBlank())) {
                                continue;
                        }

                        String pin = pinService.gerarPin();
                        solicitacao.setPinRetirada(pin);
                        solicitacaoRepository.save(solicitacao);

                        try {
                                if (solicitacao.getSolicitante() != null
                                                && solicitacao.getSolicitante().getEmail() != null
                                                && !solicitacao.getSolicitante().getEmail().isBlank()) {

                                        emailService.enviarPin(
                                                        solicitacao.getSolicitante().getEmail(),
                                                        solicitacao.getLote().getTipoTecido(),
                                                        pin);
                                }
                        } catch (Exception e) {
                                e.printStackTrace();
                        }
                }
        }

        private int prioridadeMicroempresa(Solicitacao s) {
                if (s == null) return 99;

                if ("ACEITA".equalsIgnoreCase(s.getStatus())
                                && !s.isPagamentoConfirmado()) {
                        return 1; // precisa pagar
                }

                if ("ACEITA".equalsIgnoreCase(s.getStatus())
                                && s.isPagamentoConfirmado()) {
                        return 2; // pagamento feito, aguardando retirada/PIN
                }

                if ("PENDENTE".equalsIgnoreCase(s.getStatus())) {
                        return 3; // aguardando aprovação da indústria
                }

                if ("RETIRADA".equalsIgnoreCase(s.getStatus())) {
                        return 4;
                }

                if ("RECUSADA".equalsIgnoreCase(s.getStatus())
                                || "CANCELADA".equalsIgnoreCase(s.getStatus())) {
                        return 5;
                }

                return 99;
        }

        private int prioridadeOng(Solicitacao s) {
                if (s == null) return 99;

                if ("ACEITA".equalsIgnoreCase(s.getStatus())) {
                        return 1; // PIN disponível
                }

                if ("PENDENTE".equalsIgnoreCase(s.getStatus())) {
                        return 2; // aguardando aprovação
                }

                if ("RETIRADA".equalsIgnoreCase(s.getStatus())) {
                        return 3;
                }

                if ("RECUSADA".equalsIgnoreCase(s.getStatus())
                                || "CANCELADA".equalsIgnoreCase(s.getStatus())) {
                        return 4;
                }

                return 99;
        }

        private java.time.LocalDateTime dataOrdenacao(Solicitacao s) {
                if (s == null) return null;

                if (s.getDataRetirada() != null) {
                        return s.getDataRetirada();
                }

                return s.getDataSolicitacao();
        }

        private List<Lote> buscarLotesDisponiveis(
                        String finalidade) {

                return loteRepository
                                .findByFinalidadeIgnoreCase(finalidade)
                                .stream()

                                .filter(
                                                lote -> lote.getPeso() != null
                                                                &&
                                                                lote.getPeso() > 0)

                                .filter(
                                                lote -> lote.getStatus() != null
                                                                &&
                                                                "Disponível"
                                                                                .equalsIgnoreCase(
                                                                                                lote.getStatus()))

                                .collect(
                                                Collectors.toList());
        }

        private List<Lote> buscarLotesVitrine(
                        String finalidade,
                        Set<Long> loteIdsSolicitados,
                        boolean modoDemo) {

                return loteRepository.findByFinalidadeIgnoreCase(finalidade)
                                .stream()
                                .filter(lote -> lote.getId() != null)
                                // O modo de demonstração usa exatamente as mesmas
                                // páginas do sistema real, mas nunca mistura os dados.
                                // Em demo: somente lotes da indústria demo.
                                // No sistema real: lotes da indústria demo são ocultados.
                                .filter(lote -> ehLoteDemo(lote) == modoDemo)
                                .filter(lote -> {
                                        boolean disponivel = lote.getPeso() != null
                                                        && lote.getPeso() > 0
                                                        && lote.getStatus() != null
                                                        && "Disponível".equalsIgnoreCase(lote.getStatus());

                                        return disponivel || loteIdsSolicitados.contains(lote.getId());
                                })
                                .collect(Collectors.toList());
        }


        private boolean ehLoteDemo(Lote lote) {
                if (lote == null || lote.getIndustria() == null) {
                        return false;
                }

                String token = lote.getIndustria().getTokenAprovacao();
                return token != null && token.startsWith("DEMO_TEXCICLO_");
        }

        @PostMapping("/solicitar/{loteId}")
        public String solicitar(
                        @PathVariable Long loteId,
                        @RequestParam("quantidade") Double quantidade,
                        HttpSession session) {

                Usuario usuarioLogado = (Usuario) session.getAttribute(
                                "usuarioLogado");

                if (usuarioLogado == null) {
                        return "redirect:/login";
                }

                if (!"ONG".equalsIgnoreCase(
                                usuarioLogado.getTipo())
                                &&
                                !"MICROEMPRESA".equalsIgnoreCase(
                                                usuarioLogado.getTipo())) {

                        return redirecionarParaDashboard(
                                        usuarioLogado);
                }

                if (quantidade == null
                                ||
                                quantidade <= 0) {

                        return redirecionarParaDashboard(
                                        usuarioLogado) + "?erro=quantidade";
                }

                Lote lote = loteRepository
                                .findById(loteId)
                                .orElse(null);

                if (lote == null) {

                        return redirecionarParaDashboard(
                                        usuarioLogado) + "?erro=indisponivel";
                }

                // Impede que uma conta real solicite um lote de demonstração
                // ou que a demonstração altere dados do sistema real.
                boolean modoDemo = Boolean.TRUE.equals(session.getAttribute("demoMode"));
                if (ehLoteDemo(lote) != modoDemo) {
                        return redirecionarParaDashboard(usuarioLogado) + "?erro=indisponivel";
                }

                if (lote.getStatus() == null
                                ||
                                !"Disponível".equalsIgnoreCase(
                                                lote.getStatus())) {

                        return redirecionarParaDashboard(
                                        usuarioLogado) + "?erro=indisponivel";
                }

                if (lote.getPeso() == null
                                ||
                                lote.getPeso() <= 0
                                ||
                                quantidade > lote.getPeso()) {

                        return redirecionarParaDashboard(
                                        usuarioLogado) + "?erro=quantidade";
                }

                if ("ONG".equalsIgnoreCase(
                                usuarioLogado.getTipo())
                                &&
                                !"doacao".equalsIgnoreCase(
                                                lote.getFinalidade())) {

                        return "redirect:/ong?erro=tipo";
                }

                if ("MICROEMPRESA".equalsIgnoreCase(
                                usuarioLogado.getTipo())
                                &&
                                !"venda".equalsIgnoreCase(
                                                lote.getFinalidade())) {

                        return "redirect:/microempresa?erro=tipo";
                }

                boolean jaPossuiSolicitacaoAtiva = solicitacaoRepository
                                .findBySolicitante(usuarioLogado)
                                .stream()

                                .filter(
                                                solicitacao -> solicitacao.getLote() != null
                                                                &&
                                                                solicitacao
                                                                                .getLote()
                                                                                .getId() != null
                                                                &&
                                                                solicitacao
                                                                                .getLote()
                                                                                .getId()
                                                                                .equals(loteId))

                                .anyMatch(
                                                solicitacao -> "PENDENTE"
                                                                .equalsIgnoreCase(
                                                                                solicitacao
                                                                                                .getStatus())
                                                                ||
                                                                "ACEITA"
                                                                                .equalsIgnoreCase(
                                                                                                solicitacao
                                                                                                                .getStatus()));

                if (jaPossuiSolicitacaoAtiva) {

                        return redirecionarParaDashboard(
                                        usuarioLogado) + "?erro=ja-solicitado";
                }

                Solicitacao solicitacao = new Solicitacao();

                solicitacao.setLote(lote);

                solicitacao.setSolicitante(
                                usuarioLogado);

                solicitacao.setQuantidadeSolicitada(
                                quantidade);

                solicitacao.setStatus(
                                "PENDENTE");

                solicitacao.setReservaAtiva(
                                false);

                if ("venda".equalsIgnoreCase(
                                lote.getFinalidade())
                                &&
                                lote.getPreco() != null
                                &&
                                lote.getPreco() > 0
                                &&
                                lote.getPeso() != null
                                &&
                                lote.getPeso() > 0) {

                        double valorPorKg = lote.getPreco()
                                        /
                                        lote.getPeso();

                        double valorSolicitado = valorPorKg
                                        *
                                        quantidade;

                        valorSolicitado = Math.round(
                                        valorSolicitado * 100.0)
                                        / 100.0;

                        solicitacao.setValorSolicitado(
                                        valorSolicitado);

                } else {

                        solicitacao.setValorSolicitado(
                                        0.0);
                }

                solicitacaoRepository.save(
                                solicitacao);

                if (lote.getIndustria() != null
                                &&
                                lote.getIndustria().getEmail() != null
                                &&
                                !lote.getIndustria()
                                                .getEmail()
                                                .isBlank()) {

                        try {

                                emailService
                                                .enviarNotificacaoSolicitacao(
                                                                lote.getIndustria()
                                                                                .getEmail(),

                                                                usuarioLogado
                                                                                .getNome(),

                                                                lote.getTipoTecido());

                        } catch (Exception e) {

                                e.printStackTrace();
                        }
                }

                return redirecionarParaDashboard(
                                usuarioLogado) + "?sucesso=solicitacao";
        }

        @PostMapping("/solicitacoes/cancelar/{loteId}")
        public String cancelarSolicitacao(
                        @PathVariable Long loteId,
                        HttpSession session) {

                Usuario usuarioLogado = (Usuario) session.getAttribute("usuarioLogado");

                if (usuarioLogado == null) {
                        return "redirect:/login";
                }

                if (!"ONG".equalsIgnoreCase(usuarioLogado.getTipo())
                                && !"MICROEMPRESA".equalsIgnoreCase(usuarioLogado.getTipo())) {
                        return redirecionarParaDashboard(usuarioLogado);
                }

                Solicitacao solicitacao = solicitacaoRepository
                                .findBySolicitante(usuarioLogado)
                                .stream()
                                .filter(s -> s.getLote() != null
                                                && s.getLote().getId() != null
                                                && s.getLote().getId().equals(loteId))
                                .filter(s -> "PENDENTE".equalsIgnoreCase(s.getStatus())
                                                || "ACEITA".equalsIgnoreCase(s.getStatus()))
                                .findFirst()
                                .orElse(null);

                if (solicitacao == null) {
                        return redirecionarParaDashboard(usuarioLogado) + "?erro=cancelamento";
                }

                // Uma venda já paga não pode ser cancelada por esta ação.
                if (solicitacao.isPagamentoConfirmado()) {
                        return redirecionarParaDashboard(usuarioLogado) + "?erro=cancelamento";
                }

                // Se a solicitação já tinha sido aprovada, o estoque foi
                // reservado naquele momento. Ao cancelar, devolvemos o saldo.
                if (solicitacao.isReservaAtiva()
                                && solicitacao.getLote() != null
                                && solicitacao.getQuantidadeSolicitada() != null) {

                        Lote lote = solicitacao.getLote();

                        double pesoAtual = lote.getPeso() != null
                                        ? lote.getPeso()
                                        : 0.0;

                        double pesoRestaurado = pesoAtual
                                        + solicitacao.getQuantidadeSolicitada();

                        lote.setPeso(pesoRestaurado);

                        if (pesoRestaurado > 0.0) {
                                lote.setStatus("Disponível");
                        }

                        loteRepository.save(lote);
                }

                solicitacao.setStatus("CANCELADA");
                solicitacao.setReservaAtiva(false);
                solicitacao.setPinRetirada(null);

                // Limpa os dados do PIX simulado, se houver.
                solicitacao.setFormaPagamento(null);
                solicitacao.setPagamentoStatus(null);
                solicitacao.setPixCopiaECola(null);
                solicitacao.setImagemPix(null);

                solicitacaoRepository.save(solicitacao);

                return redirecionarParaDashboard(usuarioLogado)
                                + "?aba=minhas&sucesso=cancelamento";
        }

        private String redirecionarParaDashboard(
                        Usuario usuario) {

                if (usuario == null
                                ||
                                usuario.getTipo() == null) {

                        return "redirect:/login";
                }

                if ("ONG".equalsIgnoreCase(
                                usuario.getTipo())) {

                        return "redirect:/ong";
                }

                if ("MICROEMPRESA".equalsIgnoreCase(
                                usuario.getTipo())) {

                        return "redirect:/microempresa";
                }

                if ("INDUSTRIA".equalsIgnoreCase(
                                usuario.getTipo())) {

                        return "redirect:/industria";
                }

                return "redirect:/login";
        }
}