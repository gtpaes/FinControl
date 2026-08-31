package com.fincontrol.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Implementação de UserDetails que "ponteia" nossa entidade User
 * para o mundo do Spring Security.
 *
 * O Spring Security não conhece a nossa entidade User — ele só entende
 * UserDetails. Carregamos o id do usuário dentro do principal para que
 * os endpoints futuros possam identificar o dono dos dados
 * (nunca confiamos em userId enviado pelo frontend).
 */
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final String role;
    private final boolean active;

    public UserPrincipal(java.util.UUID id, String email, String passwordHash, String role, boolean active) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
    }

    public UUID getId() {
        return id;
    }

    /** Authorities = permissões derivadas da role (ex.: ROLE_USER). */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    /** Usuários desativados não conseguem autenticar. */
    @Override
    public boolean isEnabled() {
        return active;
    }

    // Contas não expiram nem são bloqueadas por tempo nesta fase
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}