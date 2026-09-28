package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String fotoPerfil;

    private String cnpj;
    private String telefone;
    private String documentoComprovante;

    private String tokenAprovacao;

    /** Nome do arquivo PNG da assinatura digital da indústria, salvo em /uploads. */
    private String assinaturaDigital;

    private Double kgDesviados = 0.0;
    private Integer entregasRealizadas = 0;

    public Usuario() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getDocumentoComprovante() {
        return documentoComprovante;
    }

    public void setDocumentoComprovante(String documentoComprovante) {
        this.documentoComprovante = documentoComprovante;
    }

    public String getAssinaturaDigital() {
        return assinaturaDigital;
    }

    public void setAssinaturaDigital(String assinaturaDigital) {
        this.assinaturaDigital = assinaturaDigital;
    }

    public String getTokenAprovacao() {
        return tokenAprovacao;
    }

    public void setTokenAprovacao(String tokenAprovacao) {
        this.tokenAprovacao = tokenAprovacao;
    }

    public Double getKgDesviados() {
        return kgDesviados;
    }

    public void setKgDesviados(Double kgDesviados) {
        this.kgDesviados = kgDesviados;
    }

    public Integer getEntregasRealizadas() {
        return entregasRealizadas;
    }

    public void setEntregasRealizadas(Integer entregasRealizadas) {
        this.entregasRealizadas = entregasRealizadas;
    }
}
