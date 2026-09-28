package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Solicitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lote_id")
    private Lote lote;

    @ManyToOne
    @JoinColumn(name = "solicitante_id")
    private Usuario solicitante;

    private String status = "PENDENTE";

    private Double quantidadeSolicitada;

    private Double valorSolicitado;

    private boolean reservaAtiva;

    private String pinRetirada;

    private String pdfCompromisso;

    private LocalDateTime dataSolicitacao = LocalDateTime.now();

    /** Data em que a retirada foi efetivamente confirmada pela indústria. */
    private LocalDateTime dataRetirada;

    // =========================
    // PAGAMENTO SIMULADO
    // =========================

    private String formaPagamento;

    private String pagamentoStatus;

    private String pixCopiaECola;

    private String imagemPix;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Lote getLote() {
        return lote;
    }

    public void setLote(Lote lote) {
        this.lote = lote;
    }

    public Usuario getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(Usuario solicitante) {
        this.solicitante = solicitante;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getQuantidadeSolicitada() {
        return quantidadeSolicitada;
    }

    public void setQuantidadeSolicitada(Double quantidadeSolicitada) {
        this.quantidadeSolicitada = quantidadeSolicitada;
    }

    public Double getValorSolicitado() {
        return valorSolicitado;
    }

    public void setValorSolicitado(Double valorSolicitado) {
        this.valorSolicitado = valorSolicitado;
    }

    public boolean isReservaAtiva() {
        return reservaAtiva;
    }

    public void setReservaAtiva(boolean reservaAtiva) {
        this.reservaAtiva = reservaAtiva;
    }

    public String getPinRetirada() {
        return pinRetirada;
    }

    public void setPinRetirada(String pinRetirada) {
        this.pinRetirada = pinRetirada;
    }

    public String getPdfCompromisso() {
        return pdfCompromisso;
    }

    public void setPdfCompromisso(String pdfCompromisso) {
        this.pdfCompromisso = pdfCompromisso;
    }

    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }

    public void setDataSolicitacao(LocalDateTime dataSolicitacao) {
        this.dataSolicitacao = dataSolicitacao;
    }

    public LocalDateTime getDataRetirada() {
        return dataRetirada;
    }

    public void setDataRetirada(LocalDateTime dataRetirada) {
        this.dataRetirada = dataRetirada;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public String getPagamentoStatus() {
        return pagamentoStatus;
    }

    public void setPagamentoStatus(String pagamentoStatus) {
        this.pagamentoStatus = pagamentoStatus;
    }

    public String getPixCopiaECola() {
        return pixCopiaECola;
    }

    public void setPixCopiaECola(String pixCopiaECola) {
        this.pixCopiaECola = pixCopiaECola;
    }

    public String getImagemPix() {
        return imagemPix;
    }

    public void setImagemPix(String imagemPix) {
        this.imagemPix = imagemPix;
    }

    /**
     * Os dados de contato entre as partes só ficam disponíveis
     * enquanto a solicitação estiver aceita e aguardando a retirada.
     */
    public boolean isComunicacaoAtiva() {
        return "ACEITA".equalsIgnoreCase(status);
    }

    public boolean isPagamentoConfirmado() {
        return "PAGO".equalsIgnoreCase(pagamentoStatus);
    }

    public String getPixQrCode() {
        return imagemPix;
    }

    public void setPixQrCode(String pixQrCode) {
        this.imagemPix = pixQrCode;
    }
}