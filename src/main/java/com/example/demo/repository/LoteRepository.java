package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Lote;
import com.example.demo.model.Usuario;

public interface LoteRepository
        extends JpaRepository<Lote, Long> {

    List<Lote> findByIndustria(
            Usuario industria
    );

    List<Lote> findByFinalidadeIgnoreCase(
            String finalidade
    );

}