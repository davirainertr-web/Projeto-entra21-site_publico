package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.EmailService;

@Controller
public class AdminController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/admin/revisar/{token}")
    public String revisar(@PathVariable String token, Model model) {
        Usuario usuario = usuarioRepository.findByTokenAprovacao(token).orElse(null);
        if (usuario == null) {
            model.addAttribute("mensagem", "Link inválido ou já utilizado.");
            return "admin-resultado";
        }
        model.addAttribute("usuario", usuario);
        return "admin-revisar";
    }

    @GetMapping("/admin/aprovar/{token}")
    public String aprovar(@PathVariable String token, Model model) {
        Usuario usuario = usuarioRepository.findByTokenAprovacao(token).orElse(null);
        if (usuario == null) {
            model.addAttribute("mensagem", "Link inválido ou já utilizado.");
            return "admin-resultado";
        }
        usuario.setStatus("APROVADO");
        usuario.setTokenAprovacao(null);
        usuarioRepository.save(usuario);
        emailService.enviarResultado(usuario.getEmail(), true);
        model.addAttribute("mensagem", "Cadastro de " + usuario.getNome() + " aprovado com sucesso.");
        return "admin-resultado";
    }

    @GetMapping("/admin/rejeitar/{token}")
    public String rejeitar(@PathVariable String token, Model model) {
        Usuario usuario = usuarioRepository.findByTokenAprovacao(token).orElse(null);
        if (usuario == null) {
            model.addAttribute("mensagem", "Link inválido ou já utilizado.");
            return "admin-resultado";
        }
        usuario.setStatus("REJEITADO");
        usuario.setTokenAprovacao(null);
        usuarioRepository.save(usuario);
        emailService.enviarResultado(usuario.getEmail(), false);
        model.addAttribute("mensagem", "Cadastro de " + usuario.getNome() + " rejeitado.");
        return "admin-resultado";
    }
}