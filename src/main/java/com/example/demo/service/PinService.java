package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;

@Service
public class PinService {

    private final SecureRandom random = new SecureRandom();

    public String gerarPin() {
        int numero = random.nextInt(10000);
        return String.format("%04d", numero);
    }
}