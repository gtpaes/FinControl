package com.fincontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada da aplicação FinControl.
 *
 * O Spring Boot faz o "bootstrap" automaticamente:
 * - sobe um servidor web embutido (Tomcat);
 * - escaneia este pacote e subpacotes procurando por @RestController, @Service, etc.;
 * - configura o Spring Data MongoDB a partir do application.yml (connection via MONGODB_URI).
 *
 * @EnableMongoAuditing ativa os callbacks @CreatedDate/@LastModifiedDate
 * (createdAt/updatedAt) nos documentos MongoDB.
 */
@SpringBootApplication
public class FinControlApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinControlApplication.class, args);
    }
}
