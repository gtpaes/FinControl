package com.fincontrol.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.UUID;

/**
 * Usuário do sistema (documento MongoDB).
 *
 * Pontos de segurança:
 * - a senha NUNCA é armazenada em texto puro: apenas o hash BCrypt (passwordHash);
 * - o e-mail é normalizado (lowercase) antes de salvar;
 * - role é controlada pelo backend, nunca pelo cliente.
 *
 * Modelagem MongoDB:
 * - O _id interno do MongoDB (ObjectId) é gerado automaticamente.
 * - Mantemos um campo {@code id} com UUID de aplicação para preservar o
 *   contrato das APIs (os UUIDs retornados continuam válidos).
 */
@Document(collection = "users")
public class User {

    @Id
    private String mongoId; // _id interno do MongoDB (não exposto)

    /**
     * UUID da aplicação — preserva o contrato das APIs.
     * Índice único para garantir unicidade de appId.
     * O getter é {@code getId()} para manter o contrato das APIs existentes.
     */
    @Field("id")
    @Indexed(unique = true)
    private UUID appId = UUID.randomUUID();

    @Field("name")
    private String name;

    /** E-mail normalizado em lowercase; único (índice único). */
    @Field("email")
    @Indexed(unique = true)
    private String email;

    /** Somente hash BCrypt. NUNCA armazenar texto puro. */
    @Field("password_hash")
    private String passwordHash;

    @Field("role")
    private UserRole role;

    @Field("active")
    private boolean active = true;

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    // ===== Construtores =====

    public User() { }

    // ===== Getters e Setters =====

    public UUID getId() {
        return appId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}