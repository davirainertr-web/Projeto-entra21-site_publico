package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoTecido;

    private Double peso;

    private Double pesoInicial;

    private Double preco;

    private Double precoInicial;

    private String finalidade;

    private boolean temMarca;

    private String status = "Disponível";

    private String imagem;

    private String pdfCompromisso;

    @ManyToOne
    @JoinColumn(name = "usuario_industria_id", nullable = false)
    private Usuario industria;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoTecido() {
        return tipoTecido;
    }

    public void setTipoTecido(String tipoTecido) {
        this.tipoTecido = tipoTecido;
    }

    public Double getPeso() {
        return peso;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public Double getPesoInicial() {
        return pesoInicial;
    }

    public void setPesoInicial(Double pesoInicial) {
        this.pesoInicial = pesoInicial;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(Double preco) {
        this.preco = preco;
    }

    public Double getPrecoInicial() {
        return precoInicial;
    }

    public void setPrecoInicial(Double precoInicial) {
        this.precoInicial = precoInicial;
    }

    public String getFinalidade() {
        return finalidade;
    }

    public void setFinalidade(String finalidade) {
        this.finalidade = finalidade;
    }

    public boolean isTemMarca() {
        return temMarca;
    }

    public void setTemMarca(boolean temMarca) {
        this.temMarca = temMarca;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public String getPdfCompromisso() {
        return pdfCompromisso;
    }

    public void setPdfCompromisso(String pdfCompromisso) {
        this.pdfCompromisso = pdfCompromisso;
    }

    public Usuario getIndustria() {
        return industria;
    }

    public void setIndustria(Usuario industria) {
        this.industria = industria;
    }
}