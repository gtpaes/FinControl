package com.fincontrol.security;

import com.fincontrol.entity.User;
import com.fincontrol.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Serviço que o Spring Security usa para carregar usuários.
 *
 * Integração: JWT -> filter -> loadUserById -> UserDetails -> SecurityContext.
 * Implementa a interface do Spring Security (UserDetailsService) em vez de
 * criar um mecanismo de autenticação próprio.
 */
@Service
public class CustomUserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Usado pelo processo de login (busca por e-mail). */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return toPrincipal(user);
    }

    /** Usado pelo filtro JWT (busca por id presente no token). */
    public UserDetails loadUserById(UUID id) {
        return userRepository.findByAppId(id)
                .map(CustomUserDetailsService::toPrincipal)
                .orElse(null);
    }

    private static UserDetails toPrincipal(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole().name(),
                user.isActive()
        );
    }
}