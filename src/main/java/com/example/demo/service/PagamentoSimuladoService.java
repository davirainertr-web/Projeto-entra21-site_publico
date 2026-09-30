package com.example.demo.service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import com.example.demo.model.Solicitacao;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;

@Service
public class PagamentoSimuladoService {

    /** Gera um QR Code visual de demonstração; não movimenta dinheiro. */
    public void prepararPix(Solicitacao solicitacao) throws Exception {

        if (solicitacao == null || solicitacao.getId() == null) {
            throw new IllegalArgumentException("Solicitação inválida.");
        }

        double valor = solicitacao.getValorSolicitado() != null
                ? solicitacao.getValorSolicitado()
                : 0.0;

        if (valor <= 0) {
            throw new IllegalArgumentException("Esta solicitação não possui valor para pagamento.");
        }

        String valorFormatado = String.format(Locale.US, "%.2f", valor);

        String codigo = "TEXCICLO-PAGAMENTO-SIMULADO"
                + "|SOLICITACAO=" + solicitacao.getId()
                + "|VALOR=" + valorFormatado;

        File pastaUploads = new File(System.getProperty("user.dir"), "uploads");
        if (!pastaUploads.exists() && !pastaUploads.mkdirs()) {
            throw new IllegalStateException("Não foi possível criar a pasta uploads.");
        }

        String nomeArquivo = "pix_simulado_" + solicitacao.getId() + ".png";
        File arquivo = new File(pastaUploads, nomeArquivo);

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 2);

        BitMatrix matriz = new MultiFormatWriter().encode(
                codigo, BarcodeFormat.QR_CODE, 320, 320, hints);

        BufferedImage imagem = MatrixToImageWriter.toBufferedImage(matriz);
        ImageIO.write(imagem, "PNG", arquivo);

        solicitacao.setFormaPagamento("PIX");
        solicitacao.setPagamentoStatus("AGUARDANDO");
        solicitacao.setImagemPix(nomeArquivo);
        solicitacao.setPixCopiaECola(codigo);
    }
}