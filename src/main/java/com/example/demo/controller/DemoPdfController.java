package com.example.demo.controller;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

/**
 * Geração de documentos somente para a demonstração pública.
 * Nada é persistido no banco: os dados vêm do localStorage do navegador.
 */
@RestController
@RequestMapping("/demo")
public class DemoPdfController {

    private static final java.awt.Color INK = new java.awt.Color(21, 29, 25);
    private static final java.awt.Color PAPER = new java.awt.Color(246, 242, 230);
    private static final java.awt.Color RED = new java.awt.Color(127, 41, 31);
    private static final java.awt.Color GOLD = new java.awt.Color(192, 143, 46);
    private static final java.awt.Color LINE = new java.awt.Color(201, 191, 161);
    private static final java.awt.Color MUTED = new java.awt.Color(91, 101, 96);

    private static final Font WHITE_TITLE = new Font(Font.HELVETICA, 15, Font.BOLD, java.awt.Color.WHITE);
    private static final Font WHITE_SUB = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, new java.awt.Color(239, 233, 216));
    private static final Font LOGO = new Font(Font.HELVETICA, 20, Font.BOLD, java.awt.Color.WHITE);
    private static final Font LOGO_GOLD = new Font(Font.HELVETICA, 20, Font.BOLD, GOLD);
    private static final Font SECTION = new Font(Font.HELVETICA, 11, Font.BOLD, RED);
    private static final Font LABEL = new Font(Font.HELVETICA, 9, Font.BOLD, MUTED);
    private static final Font VALUE = new Font(Font.HELVETICA, 11, Font.NORMAL, INK);
    private static final Font BODY = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, INK);
    private static final Font FOOT = new Font(Font.HELVETICA, 7.5f, Font.NORMAL, MUTED);

    @PostMapping(value = "/pdf", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> gerar(@RequestBody Map<String, Object> dados) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 48, 48, 48, 54);
        PdfWriter.getInstance(doc, out);
        doc.open();

        String tipo = text(dados, "tipo");
        if ("lote".equalsIgnoreCase(tipo)) {
            gerarLote(doc, dados);
        } else {
            gerarSolicitacao(doc, dados);
        }
        doc.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=texciclo-documento-demo.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private void gerarLote(Document doc, Map<String, Object> d) throws Exception {
        cabecalho(doc, "TERMO DE COMPROMISSO", "Cadastro de lote de material têxtil");
        secao(doc, "Dados do lote");
        PdfPTable lote = tabelaDados();
        linha(lote, "Material", text(d, "material"));
        linha(lote, "Peso", number(d, "peso") + " kg");
        linha(lote, "Finalidade", finalidade(text(d, "finalidade")));
        doc.add(lote);
        espaco(doc, 14);

        secao(doc, "Dados da indústria");
        PdfPTable industria = tabelaDados();
        linha(industria, "Indústria", text(d, "industria"));
        linha(industria, "CNPJ", text(d, "industriaCnpj"));
        doc.add(industria);
        espaco(doc, 16);

        if (bool(d, "temMarca")) {
            aviso(doc, "Compromisso de descaracterização da marca",
                    "A indústria declara que este lote possui estampas, etiquetas, logotipos ou outros elementos relacionados à sua identidade visual. A indústria se compromete a retirar ou descaracterizar esses elementos antes da entrega do material ao destinatário.");
            espaco(doc, 12);
        }

        doc.add(new Paragraph("Este documento foi gerado automaticamente pela plataforma TexCiclo no modo de demonstração pública.", BODY));
        espaco(doc, 24);
        assinaturas(doc, text(d, "assinatura"), "Indústria — " + text(d, "industria"));
    }

    private void gerarSolicitacao(Document doc, Map<String, Object> d) throws Exception {
        cabecalho(doc, "TERMO DE COMPROMISSO E RETIRADA", "Confirmação de reserva de material");
        PdfPTable partes = new PdfPTable(2);
        partes.setWidthPercentage(100);
        partes.setWidths(new float[]{1f, 1f});
        partes.addCell(parte("Indústria", text(d, "industria"), text(d, "industriaCnpj")));
        partes.addCell(parte("Recebedor", text(d, "recebedor"), text(d, "recebedorCnpj")));
        doc.add(partes);
        espaco(doc, 14);

        secao(doc, "Dados do lote");
        PdfPTable lote = tabelaDados();
        linha(lote, "Material", text(d, "material"));
        linha(lote, "Quantidade", number(d, "peso") + " kg");
        linha(lote, "Finalidade", finalidade(text(d, "finalidade")));
        doc.add(lote);
        espaco(doc, 16);

        if (bool(d, "temMarca")) {
            aviso(doc, "Compromisso de descaracterização da marca",
                    "A indústria declara que este lote possui estampas, etiquetas, logotipos ou outros elementos relacionados à sua identidade visual e se compromete a retirar ou descaracterizar esses elementos antes da entrega.");
            espaco(doc, 12);
        }

        doc.add(new Paragraph("O recebedor declara estar ciente das condições de retirada do material e deverá apresentar o PIN de confirmação no momento da retirada.", BODY));
        espaco(doc, 10);
        doc.add(new Paragraph("Documento gerado automaticamente pela plataforma TexCiclo no modo de demonstração pública.", BODY));
        espaco(doc, 24);
        assinaturas(doc, text(d, "assinatura"), "Indústria — " + text(d, "industria"));
    }

    private void cabecalho(Document doc, String titulo, String subtitulo) throws Exception {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingAfter(20);
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(INK);
        c.setBorder(Rectangle.NO_BORDER);
        c.setPadding(22);
        Phrase logo = new Phrase();
        logo.add(new Chunk("Tex", LOGO));
        logo.add(new Chunk("Ciclo", LOGO_GOLD));
        c.addElement(new Paragraph(logo));
        Paragraph p = new Paragraph(titulo, WHITE_TITLE);
        p.setSpacingBefore(8);
        p.setSpacingAfter(4);
        c.addElement(p);
        c.addElement(new Paragraph(subtitulo, WHITE_SUB));
        t.addCell(c);
        doc.add(t);
    }

    private void secao(Document doc, String text) throws Exception {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingAfter(8);
        PdfPCell c = new PdfPCell(new Phrase(text.toUpperCase(), SECTION));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(RED);
        c.setBorderWidthBottom(1.2f);
        c.setPaddingBottom(6);
        c.setBorderWidthLeft(0);
        c.setBorderWidthRight(0);
        c.setBorderWidthTop(0);
        t.addCell(c);
        doc.add(t);
    }

    private PdfPTable tabelaDados() throws Exception {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1f, 2.2f});
        return t;
    }

    private void linha(PdfPTable t, String label, String value) {
        PdfPCell a = new PdfPCell(new Phrase(label.toUpperCase(), LABEL));
        a.setBorder(Rectangle.BOTTOM); a.setBorderColor(LINE); a.setPadding(8); a.setBackgroundColor(PAPER);
        PdfPCell b = new PdfPCell(new Phrase(value, VALUE));
        b.setBorder(Rectangle.BOTTOM); b.setBorderColor(LINE); b.setPadding(8);
        t.addCell(a); t.addCell(b);
    }

    private PdfPCell parte(String titulo, String nome, String cnpj) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.BOX); c.setBorderColor(LINE); c.setPadding(14);
        Paragraph a = new Paragraph(titulo.toUpperCase(), SECTION); a.setSpacingAfter(8); c.addElement(a);
        c.addElement(new Paragraph("NOME", LABEL));
        Paragraph n = new Paragraph(nome, VALUE); n.setSpacingAfter(8); c.addElement(n);
        c.addElement(new Paragraph("CNPJ", LABEL));
        c.addElement(new Paragraph(cnpj, VALUE));
        return c;
    }

    private void aviso(Document doc, String titulo, String texto) throws Exception {
        PdfPTable t = new PdfPTable(1); t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(new java.awt.Color(252, 240, 237));
        c.setBorder(Rectangle.LEFT); c.setBorderColor(RED); c.setBorderWidthLeft(3f); c.setPadding(14);
        Paragraph p = new Paragraph(titulo, new Font(Font.HELVETICA, 10.5f, Font.BOLD, RED)); p.setSpacingAfter(6); c.addElement(p);
        c.addElement(new Paragraph(texto, new Font(Font.HELVETICA, 9.5f, Font.NORMAL, INK)));
        t.addCell(c); doc.add(t);
    }

    private void assinaturas(Document doc, String assinaturaDataUrl, String rotulo) throws Exception {
        secao(doc, "Assinaturas");
        PdfPTable t = new PdfPTable(2); t.setWidthPercentage(100); t.setWidths(new float[]{1f,1f});
        PdfPCell esquerda = new PdfPCell(); esquerda.setBorder(Rectangle.NO_BORDER); esquerda.setPadding(8);
        if (assinaturaDataUrl != null && assinaturaDataUrl.startsWith("data:image/")) {
            try {
                String base64 = assinaturaDataUrl.substring(assinaturaDataUrl.indexOf(',') + 1);
                Image img = Image.getInstance(Base64.getDecoder().decode(base64));
                img.scaleToFit(155f, 58f); esquerda.addElement(img);
                esquerda.addElement(new Paragraph("Assinatura digital cadastrada", FOOT));
            } catch (Exception ignored) {
                esquerda.addElement(new Paragraph("Assinatura digital não pôde ser carregada.", FOOT));
            }
        } else {
            esquerda.addElement(new Paragraph("Assinatura digital não cadastrada", FOOT));
        }
        Paragraph r = new Paragraph(rotulo.toUpperCase(), LABEL); r.setSpacingBefore(8); esquerda.addElement(r);
        t.addCell(esquerda);

        PdfPCell direita = new PdfPCell(); direita.setBorder(Rectangle.NO_BORDER); direita.setPadding(8);
        PdfPTable selo = new PdfPTable(1); selo.setWidthPercentage(100);
        PdfPCell seloCell = new PdfPCell(new Phrase("✓ VALIDADO ELETRONICAMENTE\nTexCiclo", new Font(Font.HELVETICA, 9, Font.BOLD, java.awt.Color.WHITE)));
        seloCell.setBackgroundColor(new java.awt.Color(31,59,54)); seloCell.setBorder(Rectangle.NO_BORDER); seloCell.setPadding(12);
        selo.addCell(seloCell); direita.addElement(selo);
        direita.addElement(new Paragraph("TEXCICLO", LABEL));
        t.addCell(direita);
        doc.add(t);
    }

    private void espaco(Document doc, float size) throws Exception {
        Paragraph p = new Paragraph(" "); p.setSpacingAfter(size); doc.add(p);
    }

    private static String text(Map<String,Object> d, String key) {
        Object v = d.get(key);
        return v == null ? "" : String.valueOf(v);
    }

    private static boolean bool(Map<String,Object> d, String key) {
        Object v = d.get(key);
        return Boolean.TRUE.equals(v) || "true".equalsIgnoreCase(String.valueOf(v));
    }

    private static String number(Map<String,Object> d, String key) {
        Object v = d.get(key);
        if (v == null) return "0";
        try { return String.format(java.util.Locale.US, "%.1f", Double.parseDouble(String.valueOf(v))).replace('.', ','); }
        catch (Exception e) { return String.valueOf(v); }
    }

    private static String finalidade(String f) {
        return "doacao".equalsIgnoreCase(f) ? "Doação" : "Venda";
    }
}
