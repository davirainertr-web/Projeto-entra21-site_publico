package com.example.demo.util;

public class ValidadorCnpj {

    public static boolean isValido(String cnpj) {

        if (cnpj == null) {
            return false;
        }

        cnpj = cnpj.replaceAll("[^0-9]", "");

        if (cnpj.length() != 14) {
            return false;
        }

        if (cnpj.chars().distinct().count() == 1) {
            return false;
        }

        int[] pesos1 = {
            5, 4, 3, 2,
            9, 8, 7, 6,
            5, 4, 3, 2
        };

        int[] pesos2 = {
            6, 5, 4, 3, 2,
            9, 8, 7, 6, 5, 4, 3, 2
        };

        int soma = 0;

        for (int i = 0; i < 12; i++) {
            soma +=
                (cnpj.charAt(i) - '0') *
                pesos1[i];
        }

        int dv1 = 11 - (soma % 11);

        if (dv1 >= 10) {
            dv1 = 0;
        }

        soma = 0;

        for (int i = 0; i < 13; i++) {
            soma +=
                (cnpj.charAt(i) - '0') *
                pesos2[i];
        }

        int dv2 = 11 - (soma % 11);

        if (dv2 >= 10) {
            dv2 = 0;
        }

        return
            dv1 == (cnpj.charAt(12) - '0') &&
            dv2 == (cnpj.charAt(13) - '0');
    }
}