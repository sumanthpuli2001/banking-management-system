package com.apexbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ApexBankingApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApexBankingApplication.class, args);
    }
}
