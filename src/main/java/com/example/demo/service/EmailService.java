package com.example.demo.service;

import org.springframework.stereotype.Service;

/** Serviço intencionalmente sem SMTP na versão pública. */
@Service
public class EmailService {
    public void enviarSolicitacaoAprovacao(String nome, String tipo, String linkRevisar) { }
    public void enviarResultado(String emailDestino, boolean aprovado) { }
    public void enviarNotificacaoSolicitacao(String emailIndustria, String nomeSolicitante, String materiaPrima) { }
    public void enviarPin(String emailDestino, String materiaPrima, String pin) { }
}
