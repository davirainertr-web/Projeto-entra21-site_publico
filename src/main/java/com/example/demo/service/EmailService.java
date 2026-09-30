package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Service
public class EmailService {

        @Autowired
        private JavaMailSender mailSender;

        @Value("${texciclo.email.admin}")
        private String emailAdmin;

        @Async
        public void enviarNotificacaoSolicitacao(
                        String emailIndustria,
                        String nomeSolicitante,
                        String materiaPrima) {

                SimpleMailMessage msg = new SimpleMailMessage();

                msg.setTo(emailIndustria);

                msg.setSubject(
                                "Nova solicitação de lote — TexCiclo");

                msg.setText(
                                nomeSolicitante +
                                                " solicitou o lote \"" +
                                                materiaPrima +
                                                "\".\n\n" +
                                                "Acesse sua conta no TexCiclo para aceitar ou recusar.");

                mailSender.send(msg);
        }

        @Async
        public void enviarPin(String emailDestino, String materiaPrima, String pin) {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(emailDestino);
                msg.setSubject("Solicitação aceita — TexCiclo");
                msg.setText(
                                "Sua solicitação do lote \"" + materiaPrima + "\" foi aceita!\n\n" +
                                                "Seu PIN de retirada é: " + pin + "\n\n" +
                                                "Apresente este PIN na indústria no momento da retirada. Você tem até 72 horas para retirar o material.");
                mailSender.send(msg);
        }
}