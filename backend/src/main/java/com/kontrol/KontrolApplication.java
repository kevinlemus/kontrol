package com.kontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KontrolApplication {
    public static void main(String[] args) {
        SpringApplication.run(KontrolApplication.class, args);
    }
}
