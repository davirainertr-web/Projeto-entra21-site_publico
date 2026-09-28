package com.example.demo.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
import com.example.demo.util.ValidadorCnpj;

import jakarta.servlet.http.HttpSession;

@Controller
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private SolicitacaoRepository solicitacaoRepository;

    @Autowired
    private PdfService pdfService;


    // =========================================================
    // ASSINATURA DIGITAL DA INDÚSTRIA
    // =========================================================

    @PostMapping("/assinatura/salvar")
    public String salvarAssinatura(
            @RequestParam("assinatura") String assinatura,
            @RequestParam(value = "confirmarAlteracao", defaultValue = "false") boolean confirmarAlteracao,
            HttpSession session) {

        Usuario usuarioSessao = (Usuario) session.getAttribute("usuarioLogado");

        if (usuarioSessao == null) {
            return "redirect:/login";
        }

        if (!"INDUSTRIA".equalsIgnoreCase(usuarioSessao.getTipo())) {
            return "redirect:/";
        }

        if (assinatura == null || assinatura.isBlank()
                || !assinatura.startsWith("data:image/png;base64,")) {
            return "redirect:/industria?erro=assinatura";
        }

        try {
            String base64 = assinatura.substring("data:image/png;base64,".length());

            if (!Pattern.matches("^[A-Za-z0-9+/=\\r\\n]+$", base64)) {
                return "redirect:/industria?erro=assinatura";
            }

            byte[] dados = Base64.getDecoder().decode(base64.replaceAll("\\s", ""));

            // Evita arquivos de assinatura exageradamente grandes.
            if (dados.length == 0 || dados.length > 2 * 1024 * 1024) {
                return "redirect:/industria?erro=assinatura";
            }

            Usuario industria = usuarioRepository.findById(usuarioSessao.getId())
                    .orElse(null);

            if (industria == null) {
                return "redirect:/login";
            }

            String assinaturaAnterior = industria.getAssinaturaDigital();

            if (assinaturaAnterior != null && !assinaturaAnterior.isBlank() && !confirmarAlteracao) {
                return "redirect:/industria?erro=confirmacao-assinatura";
            }

            String novoArquivo = "assinatura_industria_" + UUID.randomUUID() + ".png";

            File pastaUploads = new File(System.getProperty("texciclo.upload-dir", "uploads"));
            if (!pastaUploads.exists() && !pastaUploads.mkdirs()) {
                throw new IOException("Não foi possível criar a pasta uploads.");
            }

            File arquivoNovo = new File(pastaUploads, novoArquivo);
            Files.write(arquivoNovo.toPath(), dados);

            // O banco passa a apontar para a nova assinatura somente depois
            // que o arquivo foi gravado com sucesso.
            industria.setAssinaturaDigital(novoArquivo);
            usuarioRepository.save(industria);
            session.setAttribute("usuarioLogado", industria);

            // Regenera os documentos da indústria para que a assinatura
            // efetivamente apareça nos PDFs já existentes.
            for (Lote lote : loteRepository.findByIndustria(industria)) {

                if (lote.isTemMarca() && lote.getPdfCompromisso() != null) {
                    String novoPdf = pdfService.gerarCompromissoCadastro(lote);
                    lote.setPdfCompromisso(novoPdf);
                    loteRepository.save(lote);
                }
            }

            for (Solicitacao solicitacao : solicitacaoRepository.findByLote_Industria(industria)) {

                if (solicitacao.getPdfCompromisso() != null
                        && solicitacao.getLote() != null
                        && solicitacao.getSolicitante() != null) {

                    String novoPdf = pdfService.gerarCompromisso(
                            solicitacao.getLote(),
                            solicitacao.getSolicitante());

                    solicitacao.setPdfCompromisso(novoPdf);
                    solicitacaoRepository.save(solicitacao);
                }
            }

            // Só remove o arquivo anterior depois de tudo ter sido salvo.
            if (assinaturaAnterior != null && !assinaturaAnterior.isBlank()
                    && !assinaturaAnterior.equals(novoArquivo)) {

                File antigo = new File(pastaUploads, assinaturaAnterior);
                if (antigo.exists()) {
                    antigo.delete();
                }
            }

            return "redirect:/industria?sucesso=assinatura";
        } catch (IllegalArgumentException e) {
            return "redirect:/industria?erro=assinatura";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/industria?erro=assinatura";
        }
    }

    @GetMapping("/login")
    public String login() {
        return "redirect:/teste-perfis";
    }

    @GetMapping("/cadastro")
    public String cadastro(Model model) {
        return "redirect:/teste-perfis";
    }

    @PostMapping("/cadastro")
    public String salvarCadastro(
            @ModelAttribute("usuario") Usuario usuario,
            @RequestParam("confirmarSenha") String confirmarSenha,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "documento", required = false) MultipartFile documento,
            Model model) {
        return "redirect:/teste-perfis";
    }

    private String salvarArquivo(MultipartFile arquivo) throws Exception {
        String nomeArquivo = UUID.randomUUID() + "_" + arquivo.getOriginalFilename();
        File pasta = new File(System.getProperty("texciclo.upload-dir", "uploads"));
        if (!pasta.exists()) pasta.mkdirs();
        arquivo.transferTo(new File(pasta, nomeArquivo));
        return nomeArquivo;
    }

    @PostMapping("/login")
    public String realizarLogin(
            @RequestParam("email") String email,
            @RequestParam("senha") String senha,
            HttpSession session,
            Model model) {
        return "redirect:/teste-perfis";
    }
}
