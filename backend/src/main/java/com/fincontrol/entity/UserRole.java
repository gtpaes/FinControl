package com.fincontrol.entity;

/**
 * Papéis do usuário. Por enquanto apenas estrutura preparada:
 * o cadastro público sempre cria USER (nunca deixamos o cliente escolher).
 * ADMIN será criado no futuro por mecanismo controlado.
 */
public enum UserRole {
    ADMIN,
    USER
}