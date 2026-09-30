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

            File pastaUploads = new File(System.getProperty("user.dir"), "uploads");
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
        return "login";
    }

    @GetMapping("/cadastro")
    public String cadastro(Model model) {
        model.addAttribute("usuario", new Usuario());
        return "cadastro";
    }

    @PostMapping("/cadastro")
    public String salvarCadastro(
            @ModelAttribute("usuario") Usuario usuario,
            @RequestParam("confirmarSenha") String confirmarSenha,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "documento", required = false) MultipartFile documento,
            Model model) {

        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            model.addAttribute("erro", "Informe uma senha.");
            return "cadastro";
        }

        if (!usuario.getSenha().equals(confirmarSenha)) {
            model.addAttribute("erro", "As senhas não coincidem.");
            return "cadastro";
        }

        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            model.addAttribute("erro", "Este e-mail já está cadastrado.");
            return "cadastro";
        }

        if (!ValidadorCnpj.isValido(usuario.getCnpj())) {
            model.addAttribute("erro", "CNPJ inválido. Verifique o número informado.");
            return "cadastro";
        }

        // As indústrias do TexCiclo ficam, nesta versão do projeto, restritas a Blumenau.
        // ONG e Microempresa continuam usando a cidade informada no cadastro.
        if ("INDUSTRIA".equalsIgnoreCase(usuario.getTipo())) {
            usuario.setCidade("Blumenau - SC");
        }

        if (documento == null || documento.isEmpty()) {
            model.addAttribute("erro", "Envie um documento comprobatório (Cartão CNPJ, contrato social ou estatuto).");
            return "cadastro";
        }

        if (foto != null && !foto.isEmpty()) {
            try {
                usuario.setFotoPerfil(salvarArquivo(foto));
            } catch (Exception e) {
                e.printStackTrace();
                model.addAttribute("erro", "Erro ao salvar a foto: " + e.getMessage());
                return "cadastro";
            }
        }

        try {
            usuario.setDocumentoComprovante(salvarArquivo(documento));
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao salvar o documento: " + e.getMessage());
            return "cadastro";
        }

        String token = UUID.randomUUID().toString();
        usuario.setTokenAprovacao(token);
        usuario.setStatus("PENDENTE");
        usuarioRepository.save(usuario);

        String linkRevisar = "http://localhost:8080/admin/revisar/" + token;
        emailService.enviarSolicitacaoAprovacao(usuario.getNome(), usuario.getTipo(), linkRevisar);

        return "redirect:/login?pendente=true";
    }

    private String salvarArquivo(MultipartFile arquivo) throws Exception {
        String nomeArquivo = UUID.randomUUID() + "_" + arquivo.getOriginalFilename();
        File pasta = new File(System.getProperty("user.dir"), "uploads");
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

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null || !usuario.getSenha().equals(senha)) {
            model.addAttribute("erro", "E-mail ou senha incorretos.");
            return "login";
        }

        if ("PENDENTE".equals(usuario.getStatus())) {
            model.addAttribute("erro", "Seu cadastro ainda está em análise. Você receberá a confirmação por e-mail em até 48 horas.");
            return "login";
        }

        if ("REJEITADO".equals(usuario.getStatus())) {
            model.addAttribute("erro", "Seu cadastro não foi aprovado. Entre em contato para mais informações.");
            return "login";
        }

        // Login normal sempre encerra o modo de demonstração.
        // Assim, a sessão real nunca carrega a interface ou o contexto demo.
        session.removeAttribute("demoMode");
        session.removeAttribute("demoPerfil");
        session.setAttribute("usuarioLogado", usuario);

        switch (usuario.getTipo()) {

            case "INDUSTRIA":
                // A assinatura é obrigatória para a indústria.
                // Se ainda não existe, a página abre automaticamente
                // o gerenciador/modal de assinatura.
                if (usuario.getAssinaturaDigital() == null
                        || usuario.getAssinaturaDigital().isBlank()) {
                    return "redirect:/industria?abrirAssinatura=true";
                }

                return "redirect:/industria";

            case "ONG":
                return "redirect:/ong";

            case "MICROEMPRESA":
                return "redirect:/microempresa";

            default:
                model.addAttribute("erro", "Tipo de usuário inválido.");
                return "login";
        }
    }
}