package com.fincontrol.repository;

import com.fincontrol.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Acesso aos dados de usuário.
 * Spring Data MongoDB gera a implementação a partir dos nomes dos métodos.
 *
 * Índice único para email é configurado na entidade User (@Indexed).
 */
public interface UserRepository extends MongoRepository<User, String> {

    /** Busca pelo UUID de aplicação (appId) preservando o contrato das APIs. */
    Optional<User> findByAppId(UUID appId);

    /** Busca por email (usado no login e register). */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}