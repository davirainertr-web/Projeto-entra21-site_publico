package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Solicitacao;
import com.example.demo.model.Usuario;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {

    List<Solicitacao> findBySolicitante(Usuario solicitante);

    List<Solicitacao> findByLote_Industria(Usuario industria);

    List<Solicitacao> findByStatus(String status);
}