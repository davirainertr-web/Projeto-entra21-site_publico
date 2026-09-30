
package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.example.demo.model.Solicitacao;
import com.example.demo.model.Usuario;
import com.example.demo.repository.SolicitacaoRepository;
import com.example.demo.repository.LoteRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.PagamentoSimuladoService;
import com.example.demo.service.PinService;

import jakarta.servlet.http.HttpSession;

@Controller
public class PagamentoSimuladoController {

    @Autowired
    private SolicitacaoRepository solicitacaoRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private PagamentoSimuladoService pagamentoSimuladoService;

    @Autowired
    private PinService pinService;

    @Autowired
    private EmailService emailService;

    /**
     * Abre uma página exclusiva para o PIX simulado.
     * Nenhum pagamento real é realizado.
     */
    @GetMapping("/pagamento/{id}")
    public String pagamento(
            @PathVariable Long id,
            HttpSession session,
            Model model) {

        Usuario usuario = usuarioLogado(session);

        if (usuario == null) {
            return "redirect:/teste-perfis";
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (!podePagar(solicitacao, usuario)) {
            return redirecionarParaDashboard(usuario) + "?erro=pagamento";
        }

        if (solicitacao.isPagamentoConfirmado()) {
            return redirecionarParaDashboard(usuario)
                    + "?aba=minhas&pagamento=" + id;
        }

        if (solicitacao.getValorSolicitado() == null
                || solicitacao.getValorSolicitado() <= 0) {
            return redirecionarParaDashboard(usuario)
                    + "?erro=pagamento-gratuito";
        }

        try {
            if (solicitacao.getImagemPix() == null
                    || solicitacao.getImagemPix().isBlank()
                    || solicitacao.getPixCopiaECola() == null
                    || solicitacao.getPixCopiaECola().isBlank()) {

                pagamentoSimuladoService.prepararPix(solicitacao);
                solicitacaoRepository.save(solicitacao);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return redirecionarParaDashboard(usuario) + "?erro=qr";
        }

        model.addAttribute("solicitacao", solicitacao);
        model.addAttribute("usuarioLogado", usuario);

        return "pagamento-pix";
    }

    /** Mantido para compatibilidade com versões anteriores. */
    @PostMapping("/pagamento/{id}/pix")
    public String gerarPix(@PathVariable Long id, HttpSession session) {
        Usuario usuario = usuarioLogado(session);

        if (usuario == null) {
            return "redirect:/teste-perfis";
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (!podePagar(solicitacao, usuario)) {
            return redirecionarParaDashboard(usuario) + "?erro=pagamento";
        }

        return "redirect:/pagamento/" + id;
    }

    /**
     * Confirma a simulação do PIX e só então libera o PIN.
     */
    @PostMapping("/pagamento/{id}/simular-pix")
    public String simularPix(@PathVariable Long id, HttpSession session) {
        Usuario usuario = usuarioLogado(session);

        if (usuario == null) {
            return "redirect:/teste-perfis";
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (!podePagar(solicitacao, usuario)
                || solicitacao.getImagemPix() == null
                || solicitacao.getImagemPix().isBlank()) {

            return redirecionarParaDashboard(usuario) + "?erro=pagamento";
        }

        finalizarPagamento(solicitacao, "PIX");

        return redirecionarParaDashboard(usuario)
                + "?aba=minhas&pagamento=" + id
                + "&sucesso=pagamento";
    }

    /**
     * Confirma o pagamento em dinheiro e libera o PIN.
     */
    @PostMapping("/pagamento/{id}/dinheiro")
    public String pagarDinheiro(@PathVariable Long id, HttpSession session) {
        Usuario usuario = usuarioLogado(session);

        if (usuario == null) {
            return "redirect:/teste-perfis";
        }

        Solicitacao solicitacao = solicitacaoRepository
                .findById(id)
                .orElse(null);

        if (!podePagar(solicitacao, usuario)
                || solicitacao.getValorSolicitado() == null
                || solicitacao.getValorSolicitado() <= 0) {

            return redirecionarParaDashboard(usuario) + "?erro=pagamento";
        }

        finalizarPagamento(solicitacao, "DINHEIRO");

        return redirecionarParaDashboard(usuario)
                + "?aba=minhas&pagamento=" + id
                + "&sucesso=pagamento";
    }

    private boolean podePagar(
            Solicitacao solicitacao,
            Usuario usuario) {

        return pertenceAoUsuario(solicitacao, usuario)
                && solicitacao.getLote() != null
                && "ACEITA".equalsIgnoreCase(solicitacao.getStatus())
                && "venda".equalsIgnoreCase(
                        solicitacao.getLote().getFinalidade())
                && !solicitacao.isPagamentoConfirmado();
    }

    private void finalizarPagamento(
            Solicitacao solicitacao,
            String formaPagamento) {

        solicitacao.setFormaPagamento(formaPagamento);
        solicitacao.setPagamentoStatus("PAGO");

        // O PIN nasce somente aqui, depois do pagamento.
        if (solicitacao.getPinRetirada() == null
                || solicitacao.getPinRetirada().isBlank()) {

            String pin = pinService.gerarPin();
            solicitacao.setPinRetirada(pin);

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

        solicitacaoRepository.save(solicitacao);

        // O lote passa a indicar que existe uma retirada pendente somente
        // quando o PIN nasceu (ou seja, depois do pagamento).
        atualizarStatusLote(solicitacao);
    }

    private void atualizarStatusLote(Solicitacao solicitacao) {
        if (solicitacao == null || solicitacao.getLote() == null) return;

        long pins = solicitacaoRepository.findByLote_Industria(
                        solicitacao.getLote().getIndustria())
                .stream()
                .filter(s -> s.getLote() != null
                        && solicitacao.getLote().getId().equals(s.getLote().getId()))
                .filter(s -> "ACEITA".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getPinRetirada() != null && !s.getPinRetirada().isBlank())
                .count();

        if (pins > 0) {
            solicitacao.getLote().setStatus(pins == 1
                    ? "Aguardando retirada"
                    : "Aguardando retiradas");
            loteRepository.save(solicitacao.getLote());
        }
    }

    private Usuario usuarioLogado(HttpSession session) {
        return (Usuario) session.getAttribute("usuarioLogado");
    }

    private boolean pertenceAoUsuario(
            Solicitacao solicitacao,
            Usuario usuario) {

        return solicitacao != null
                && solicitacao.getSolicitante() != null
                && solicitacao.getSolicitante().getId() != null
                && usuario != null
                && usuario.getId() != null
                && solicitacao.getSolicitante().getId().equals(usuario.getId());
    }

    private String redirecionarParaDashboard(Usuario usuario) {
        if (usuario == null || usuario.getTipo() == null) {
            return "redirect:/teste-perfis";
        }

        if ("MICROEMPRESA".equalsIgnoreCase(usuario.getTipo())) {
            return "redirect:/microempresa";
        }

        if ("ONG".equalsIgnoreCase(usuario.getTipo())) {
            return "redirect:/ong";
        }

        if ("INDUSTRIA".equalsIgnoreCase(usuario.getTipo())) {
            return "redirect:/industria";
        }

        return "redirect:/teste-perfis";
    }
}
