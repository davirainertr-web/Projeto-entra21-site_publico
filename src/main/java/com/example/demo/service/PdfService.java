package com.example.demo.service;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.model.Lote;
import com.example.demo.model.Usuario;
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
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfService {

    private static final Color INK = new Color(21, 29, 25);
    private static final Color PAPER = new Color(246, 242, 230);
    private static final Color THREAD_RED = new Color(167, 56, 43);
    private static final Color THREAD_RED_DARK = new Color(127, 41, 31);
    private static final Color THREAD_GOLD = new Color(192, 143, 46);
    private static final Color TEAL = new Color(31, 59, 54);
    private static final Color LINE = new Color(201, 191, 161);
    private static final Color MUTED = new Color(91, 101, 96);
    private static final Color WHITE = Color.WHITE;

    private static final Font FONT_LOGO =
            new Font(Font.HELVETICA, 20, Font.BOLD, WHITE);

    private static final Font FONT_LOGO_DOT =
            new Font(Font.HELVETICA, 20, Font.BOLD, THREAD_GOLD);

    private static final Font FONT_TITULO_DOC =
            new Font(Font.HELVETICA, 15, Font.BOLD, WHITE);

    private static final Font FONT_SECAO =
            new Font(Font.HELVETICA, 11, Font.BOLD, THREAD_RED_DARK);

    private static final Font FONT_LABEL =
            new Font(Font.HELVETICA, 9, Font.BOLD, MUTED);

    private static final Font FONT_VALOR =
            new Font(Font.HELVETICA, 11, Font.NORMAL, INK);

    private static final Font FONT_AVISO_TITULO =
            new Font(Font.HELVETICA, 10.5f, Font.BOLD, THREAD_RED_DARK);

    private static final Font FONT_AVISO_TEXTO =
            new Font(Font.HELVETICA, 9.5f, Font.NORMAL, INK);

    private static final Font FONT_CORPO =
            new Font(Font.HELVETICA, 9.5f, Font.NORMAL, INK);

    private static final Font FONT_RODAPE =
            new Font(Font.HELVETICA, 7.5f, Font.NORMAL, MUTED);

    private static final Font FONT_ASSINATURA_LINHA =
            new Font(Font.HELVETICA, 11, Font.NORMAL, INK);

    private static final Font FONT_SELO =
            new Font(Font.HELVETICA, 8.5f, Font.BOLD, WHITE);

    private static final Font FONT_SELO_DATA =
            new Font(Font.HELVETICA, 7.5f, Font.NORMAL, new Color(220, 231, 226));


    public String gerarCompromissoCadastro(Lote lote) throws Exception {

        String nomeArquivo = "compromisso_lote_" + UUID.randomUUID() + ".pdf";
        File arquivo = criarArquivo(nomeArquivo);

        Document doc = new Document(PageSize.A4, 48, 48, 0, 54);
        PdfWriter writer = PdfWriter.getInstance(doc, new FileOutputStream(arquivo));
        writer.setPageEvent(new Rodape());
        doc.open();

        cabecalho(doc, "TERMO DE COMPROMISSO", "Cadastro de lote de material têxtil");

        secao(doc, "Dados do lote");
        PdfPTable tLote = novaTabelaDados();
        linhaDado(tLote, "Material", valor(lote.getTipoTecido()));
        linhaDado(tLote, "Peso", valor(lote.getPeso()) + " kg");
        linhaDado(tLote, "Finalidade", traduzFinalidade(lote.getFinalidade()));
        doc.add(tLote);
        espaco(doc, 14);

        secao(doc, "Dados da indústria");
        PdfPTable tIndustria = novaTabelaDados();
        linhaDado(tIndustria, "Indústria", valor(lote.getIndustria().getNome()));
        linhaDado(tIndustria, "CNPJ", valor(lote.getIndustria().getCnpj()));
        doc.add(tIndustria);
        espaco(doc, 16);

        blocoAviso(
                doc,
                "Compromisso de descaracterização",
                "A indústria declara que o lote cadastrado na plataforma TexCiclo possui "
                + "elementos relacionados à sua identidade visual, como estampas, etiquetas, "
                + "logotipos ou outros elementos de identificação. A indústria se compromete a "
                + "realizar a retirada ou descaracterização desses elementos antes da entrega "
                + "do material ao destinatário."
        );

        espaco(doc, 10);
        doc.add(paragrafoCorpo(
                "Este documento foi gerado automaticamente pela plataforma TexCiclo "
                + "no momento do cadastro do lote."
        ));

        espaco(doc, 22);

        blocoAssinaturas(
                doc,
                new Assinatura("TexCiclo", true),
                new Assinatura(
                        "Indústria — " + valor(lote.getIndustria().getNome()),
                        false,
                        valor(lote.getIndustria().getCnpj()),
                        caminhoAssinatura(lote.getIndustria())
                )
        );

        doc.close();
        return nomeArquivo;
    }


    public String gerarCompromisso(Lote lote, Usuario solicitante) throws Exception {

        String nomeArquivo = "compromisso_" + UUID.randomUUID() + ".pdf";
        File arquivo = criarArquivo(nomeArquivo);

        Document doc = new Document(PageSize.A4, 48, 48, 0, 54);
        PdfWriter writer = PdfWriter.getInstance(doc, new FileOutputStream(arquivo));
        writer.setPageEvent(new Rodape());
        doc.open();

        cabecalho(doc, "TERMO DE COMPROMISSO E RETIRADA", "Confirmação de reserva de material");

        // Indústria e recebedor lado a lado
        PdfPTable partes = new PdfPTable(2);
        partes.setWidthPercentage(100);
        partes.setSpacingBefore(0);
        partes.setWidths(new float[]{1f, 1f});

        partes.addCell(celulaParte(
                "Indústria",
                valor(lote.getIndustria().getNome()),
                valor(lote.getIndustria().getCnpj())
        ));

        partes.addCell(celulaParte(
                "Recebedor",
                valor(solicitante.getNome()),
                valor(solicitante.getCnpj())
        ));

        doc.add(partes);
        espaco(doc, 14);

        secao(doc, "Dados do lote");
        PdfPTable tLote = novaTabelaDados();
        linhaDado(tLote, "Material", valor(lote.getTipoTecido()));
        linhaDado(tLote, "Peso", valor(lote.getPeso()) + " kg");
        linhaDado(tLote, "Finalidade", traduzFinalidade(lote.getFinalidade()));
        doc.add(tLote);
        espaco(doc, 16);

        if (lote.isTemMarca()) {
            blocoAviso(
                    doc,
                    "Compromisso de descaracterização da marca",
                    "A indústria declara que este lote possui estampas, etiquetas, logotipos "
                    + "ou outros elementos relacionados à sua identidade visual. A indústria "
                    + "se compromete a retirar ou descaracterizar esses elementos antes da "
                    + "entrega do material ao recebedor."
            );
            espaco(doc, 12);
        }

        doc.add(paragrafoCorpo(
                "O recebedor declara estar ciente das condições de retirada do material e "
                + "deverá apresentar o QR Code de confirmação no momento da retirada."
        ));

        espaco(doc, 8);
        doc.add(paragrafoCorpo("Documento gerado automaticamente pela plataforma TexCiclo."));

        espaco(doc, 22);

        blocoAssinaturas(
                doc,
                new Assinatura(
                        "Indústria — " + valor(lote.getIndustria().getNome()),
                        false,
                        valor(lote.getIndustria().getCnpj()),
                        caminhoAssinatura(lote.getIndustria())
                ),
                new Assinatura("TexCiclo", true)
        );

        doc.close();
        return nomeArquivo;
    }


    private void cabecalho(Document doc, String titulo, String subtitulo) throws Exception {

        PdfPTable header = new PdfPTable(1);
        header.setWidthPercentage(100);
        header.setSpacingAfter(20);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(INK);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(22);

        Phrase logo = new Phrase();
        logo.add(new Chunk("Tex", FONT_LOGO));
        logo.add(new Chunk("Ciclo", FONT_LOGO_DOT));
        Paragraph pLogo = new Paragraph(logo);
        pLogo.setSpacingAfter(10);
        cell.addElement(pLogo);

        Paragraph pTitulo = new Paragraph(titulo, FONT_TITULO_DOC);
        pTitulo.setSpacingAfter(4);
        cell.addElement(pTitulo);

        Font fontSub = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, new Color(239, 233, 216));
        cell.addElement(new Paragraph(subtitulo, fontSub));

        header.addCell(cell);
        doc.add(header);
    }


    private void secao(Document doc, String texto) throws Exception {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingBefore(2);
        t.setSpacingAfter(8);

        PdfPCell cell = new PdfPCell(new Phrase(texto.toUpperCase(), FONT_SECAO));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(THREAD_RED);
        cell.setBorderWidthBottom(1.2f);
        cell.setPaddingBottom(6);
        cell.setPaddingTop(0);
        cell.setPaddingLeft(0);

        t.addCell(cell);
        doc.add(t);
    }


    private PdfPTable novaTabelaDados() {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        try {
            t.setWidths(new float[]{1f, 2.2f});
        } catch (Exception ignored) {
        }
        return t;
    }

    private void linhaDado(PdfPTable tabela, String label, String valor) {

        PdfPCell cLabel = new PdfPCell(new Phrase(label.toUpperCase(), FONT_LABEL));
        cLabel.setBorder(Rectangle.BOTTOM);
        cLabel.setBorderColor(LINE);
        cLabel.setPadding(8);
        cLabel.setBackgroundColor(new Color(246, 242, 230));
        cLabel.setVerticalAlignment(Element.ALIGN_MIDDLE);

        PdfPCell cValor = new PdfPCell(new Phrase(valor, FONT_VALOR));
        cValor.setBorder(Rectangle.BOTTOM);
        cValor.setBorderColor(LINE);
        cValor.setPadding(8);
        cValor.setVerticalAlignment(Element.ALIGN_MIDDLE);

        tabela.addCell(cLabel);
        tabela.addCell(cValor);
    }


    private PdfPCell celulaParte(String titulo, String nome, String cnpj) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(LINE);
        cell.setPadding(14);
        cell.setBackgroundColor(new Color(255, 253, 247));

        Paragraph pTitulo = new Paragraph(titulo.toUpperCase(), FONT_SECAO);
        pTitulo.setSpacingAfter(8);
        cell.addElement(pTitulo);

        Paragraph pNomeLabel = new Paragraph("NOME", FONT_LABEL);
        pNomeLabel.setSpacingAfter(2);
        cell.addElement(pNomeLabel);

        Paragraph pNome = new Paragraph(nome, FONT_VALOR);
        pNome.setSpacingAfter(8);
        cell.addElement(pNome);

        Paragraph pCnpjLabel = new Paragraph("CNPJ", FONT_LABEL);
        pCnpjLabel.setSpacingAfter(2);
        cell.addElement(pCnpjLabel);

        cell.addElement(new Paragraph(cnpj, FONT_VALOR));

        return cell;
    }


    private void blocoAviso(Document doc, String titulo, String texto) throws Exception {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(252, 240, 237));
        cell.setBorder(Rectangle.LEFT);
        cell.setBorderColor(THREAD_RED);
        cell.setBorderWidthLeft(3f);
        cell.setPadding(14);

        Paragraph pTitulo = new Paragraph(titulo, FONT_AVISO_TITULO);
        pTitulo.setSpacingAfter(6);
        cell.addElement(pTitulo);

        cell.addElement(new Paragraph(texto, FONT_AVISO_TEXTO));

        t.addCell(cell);
        doc.add(t);
    }

  
    private static class Assinatura {
        final String rotulo;
        final boolean seloTexCiclo;
        final String cnpj;
        final String caminhoImagem;

        Assinatura(String rotulo, boolean seloTexCiclo) {
            this(rotulo, seloTexCiclo, "", null);
        }

        Assinatura(String rotulo, boolean seloTexCiclo, String cnpj) {
            this(rotulo, seloTexCiclo, cnpj, null);
        }

        Assinatura(String rotulo, boolean seloTexCiclo, String cnpj, String caminhoImagem) {
            this.rotulo = rotulo;
            this.seloTexCiclo = seloTexCiclo;
            this.cnpj = cnpj;
            this.caminhoImagem = caminhoImagem;
        }
    }


    private void blocoAssinaturas(Document doc, Assinatura... assinaturas) throws Exception {

        secao(doc, "Assinaturas");

        PdfPTable t = new PdfPTable(assinaturas.length);
        t.setWidthPercentage(100);
        t.setSpacingBefore(6);

        float[] larguras = new float[assinaturas.length];
        Arrays.fill(larguras, 1f);
        t.setWidths(larguras);

        DateTimeFormatter formatoData =
                DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

        for (Assinatura a : assinaturas) {

            PdfPCell cell = new PdfPCell();
            cell.setBorder(Rectangle.NO_BORDER);
            cell.setPadding(8);
            cell.setPaddingRight(14);
            cell.setVerticalAlignment(Element.ALIGN_BOTTOM);

            if (a.seloTexCiclo) {

                PdfPTable selo = new PdfPTable(1);
                selo.setWidthPercentage(100);

                PdfPCell seloCell = new PdfPCell();
                seloCell.setBackgroundColor(TEAL);
                seloCell.setBorder(Rectangle.NO_BORDER);
                seloCell.setPadding(12);

                Paragraph pCheck = new Paragraph(
                        "✓ VALIDADO ELETRONICAMENTE",
                        FONT_SELO
                );
                pCheck.setSpacingAfter(4);
                seloCell.addElement(pCheck);

                seloCell.addElement(new Paragraph(
                        "TexCiclo — " + LocalDateTime.now().format(formatoData),
                        FONT_SELO_DATA
                ));

                selo.addCell(seloCell);
                cell.addElement(selo);

            } else if (a.caminhoImagem != null && !a.caminhoImagem.isBlank()) {

                File arquivoAssinatura = new File(
                        System.getProperty("texciclo.upload-dir", "uploads"),
                        a.caminhoImagem
                );

                if (arquivoAssinatura.exists()) {
                    Image imagem = Image.getInstance(arquivoAssinatura.getAbsolutePath());
                    imagem.scaleToFit(155f, 58f);
                    imagem.setAlignment(Element.ALIGN_LEFT);
                    cell.addElement(imagem);

                    Paragraph assinaturaDigital = new Paragraph(
                            "Assinatura digital",
                            FONT_RODAPE
                    );
                    assinaturaDigital.setSpacingAfter(4);
                    cell.addElement(assinaturaDigital);
                } else {
                    Paragraph pLinha = new Paragraph(
                            "Assinatura digital não encontrada",
                            FONT_RODAPE
                    );
                    pLinha.setSpacingAfter(6);
                    cell.addElement(pLinha);
                }

            } else {

                Paragraph pLinha = new Paragraph(
                        "Assinatura digital não cadastrada",
                        FONT_RODAPE
                );
                pLinha.setSpacingAfter(6);
                cell.addElement(pLinha);
            }

            Paragraph pRotulo = new Paragraph(
                    a.rotulo.toUpperCase(),
                    FONT_LABEL
            );
            pRotulo.setSpacingBefore(a.seloTexCiclo ? 8 : 0);
            pRotulo.setSpacingAfter(4);
            cell.addElement(pRotulo);

            if (!a.seloTexCiclo && a.cnpj != null && !a.cnpj.isEmpty()) {
                Paragraph pCnpj = new Paragraph(
                        "CNPJ: " + a.cnpj,
                        FONT_RODAPE
                );
                cell.addElement(pCnpj);
            }

            t.addCell(cell);
        }

        doc.add(t);
    }

    private String caminhoAssinatura(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        return usuario.getAssinaturaDigital();
    }

    private Paragraph paragrafoCorpo(String texto) {
        Paragraph p = new Paragraph(texto, FONT_CORPO);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        return p;
    }

    private void espaco(Document doc, float altura) throws Exception {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(altura);
        doc.add(p);
    }

    /** Rodapé fixo com nome da plataforma e data/hora de geração, em todas as páginas. */
    private static class Rodape extends PdfPageEventHelper {

        private static final DateTimeFormatter FORMATO_DATA =
                DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfPTable rodape = new PdfPTable(2);
            try {
                rodape.setTotalWidth(
                        document.getPageSize().getWidth()
                        - document.leftMargin()
                        - document.rightMargin()
                );
                rodape.setWidths(new float[]{1f, 1f});

                PdfPCell esquerda = new PdfPCell(new Phrase(
                        "TexCiclo — Documento gerado automaticamente",
                        FONT_RODAPE
                ));
                esquerda.setBorder(Rectangle.TOP);
                esquerda.setBorderColor(LINE);
                esquerda.setPadding(8);
                esquerda.setHorizontalAlignment(Element.ALIGN_LEFT);

                PdfPCell direita = new PdfPCell(new Phrase(
                        "Gerado em " + LocalDateTime.now().format(FORMATO_DATA),
                        FONT_RODAPE
                ));
                direita.setBorder(Rectangle.TOP);
                direita.setBorderColor(LINE);
                direita.setPadding(8);
                direita.setHorizontalAlignment(Element.ALIGN_RIGHT);

                rodape.addCell(esquerda);
                rodape.addCell(direita);

                rodape.writeSelectedRows(
                        0, -1,
                        document.leftMargin(),
                        document.bottomMargin(),
                        writer.getDirectContent()
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private File criarArquivo(String nomeArquivo) {
        File pasta = new File(System.getProperty("texciclo.upload-dir", "uploads"));
        if (!pasta.exists()) {
            pasta.mkdirs();
        }
        return new File(pasta, nomeArquivo);
    }

    private String traduzFinalidade(String finalidade) {
        if ("doacao".equalsIgnoreCase(finalidade)) {
            return "Doação";
        }
        if ("venda".equalsIgnoreCase(finalidade)) {
            return "Venda";
        }
        return valor(finalidade);
    }

    private String valor(Object valor) {
        if (valor == null) {
            return "";
        }
        return String.valueOf(valor);
    }
}
