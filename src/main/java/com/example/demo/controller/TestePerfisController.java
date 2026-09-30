package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.model.Usuario;

import jakarta.servlet.http.HttpSession;

@Controller
public class TestePerfisController {

    private static final String DEMO_MODE = "demoMode";
    private static final String DEMO_PREFIX = "DEMO_TEXCICLO_LIVRE_";

    @GetMapping("/teste-perfis")
    public String escolherPerfil(HttpSession session, Model model) {
        model.addAttribute("demoMode", Boolean.TRUE.equals(session.getAttribute(DEMO_MODE)));
        return "teste-perfis";
    }

    @GetMapping("/teste-perfis/entrar")
    public String entrar(
            @RequestParam("perfil") String perfil,
            HttpSession session) {

        if (!perfilValido(perfil)) {
            return "redirect:/teste-perfis";
        }

        // No modo de demonstração, o perfil é apenas um objeto em sessão.
        // Nenhum usuário fictício é gravado no PostgreSQL.
        Usuario usuario = criarUsuarioDemo(perfil);

        session.setAttribute("usuarioLogado", usuario);
        session.setAttribute(DEMO_MODE, true);
        session.setAttribute("demoPerfil", perfil.toUpperCase());

        return redirecionar(perfil);
    }

    @GetMapping("/teste-perfis/sair")
    public String sair(HttpSession session) {
        session.removeAttribute("usuarioLogado");
        session.removeAttribute(DEMO_MODE);
        session.removeAttribute("demoPerfil");
        return "redirect:/teste-perfis";
    }

    private boolean perfilValido(String perfil) {
        return "INDUSTRIA".equalsIgnoreCase(perfil)
                || "ONG".equalsIgnoreCase(perfil)
                || "MICROEMPRESA".equalsIgnoreCase(perfil);
    }

    private String redirecionar(String perfil) {
        if ("INDUSTRIA".equalsIgnoreCase(perfil)) {
            return "redirect:/industria";
        }
        if ("ONG".equalsIgnoreCase(perfil)) {
            return "redirect:/ong";
        }
        return "redirect:/microempresa";
    }

    private Usuario criarUsuarioDemo(String perfil) {
        String tipo = perfil.toUpperCase();

        Usuario usuario = new Usuario();
        usuario.setNome(nomeDemo(tipo));
        usuario.setCidade("Blumenau");
        usuario.setEmail(emailDemo(tipo));
        usuario.setSenha("demo");
        usuario.setTipo(tipo);
        usuario.setStatus("APROVADO");
        usuario.setTokenAprovacao(DEMO_PREFIX + tipo);
        usuario.setDescricao(descricaoDemo(tipo));
        usuario.setKgDesviados(0.0);
        usuario.setEntregasRealizadas(0);

        return usuario;
    }

    private String emailDemo(String tipo) {
        return switch (tipo) {
            case "INDUSTRIA" -> "demo.industria@texciclo.local";
            case "ONG" -> "demo.ong@texciclo.local";
            default -> "demo.micro@texciclo.local";
        };
    }

    private String nomeDemo(String tipo) {
        return switch (tipo) {
            case "INDUSTRIA" -> "Vale Verde Têxtil — Demonstração";
            case "ONG" -> "Instituto Retomada — Demonstração";
            default -> "Ateliê Boa Costura — Demonstração";
        };
    }

    private String descricaoDemo(String tipo) {
        return switch (tipo) {
            case "INDUSTRIA" -> "Perfil de demonstração da indústria no TexCiclo.";
            case "ONG" -> "Perfil de demonstração de ONG no TexCiclo.";
            default -> "Perfil de demonstração de microempresa no TexCiclo.";
        };
    }
}
