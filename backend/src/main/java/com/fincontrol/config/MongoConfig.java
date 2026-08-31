package com.fincontrol.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Configuração do MongoDB.
 *
 * O @EnableMongoAuditing fica aqui (e não na classe principal) para que os
 * slices de teste @WebMvcTest não tentem carregar a infraestrutura do Mongo.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}
