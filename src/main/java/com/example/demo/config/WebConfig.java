package com.example.demo.config;

import java.io.File;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig
        implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry) {

        File pastaUploads =
                new File(
                        System.getProperty("user.dir"),
                        "uploads"
                );


        if (!pastaUploads.exists()) {
            pastaUploads.mkdirs();
        }


        String caminho =
                pastaUploads
                        .getAbsolutePath()
                        .replace("\\", "/");


        registry
                .addResourceHandler(
                        "/uploads/**"
                )
                .addResourceLocations(
                        "file:" + caminho + "/"
                );
    }
}