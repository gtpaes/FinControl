package com.fincontrol.service;

import com.fincontrol.dto.RegisterRequest;
import com.fincontrol.dto.UpdateUserRequest;
import com.fincontrol.dto.UserResponse;
import com.fincontrol.entity.User;
import com.fincontrol.entity.UserRole;
import com.fincontrol.exception.BusinessConflictException;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Regras de negócio de usuários.
 *
 * Segurança implementada aqui:
 * - e-mail normalizado para lowercase antes de qualquer operação;
 * - e-mail duplicado -> BusinessConflictException (409);
 * - senha convertida em hash BCrypt ANTES de salvar (nunca texto puro);
 * - role SEMPRE USER no cadastro público (o cliente não escolhe).
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cadastra um usuário. Retorna o UserResponse (sem dados sensíveis).
     */
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessConflictException("E-mail já cadastrado");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER); // cadastro público NUNCA escolhe role
        user.setActive(true);

        User saved = userRepository.save(user);
        log.info("Usuário cadastrado: id={} email={}", saved.getId(), normalizedEmail);

        return UserResponse.from(saved);
    }

    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmail(normalize(email))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", "e-mail informado"));
        return UserResponse.from(user);
    }

    public UserResponse findById(UUID id) {
        User user = userRepository.findByAppId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));
        return UserResponse.from(user);
    }

    /** Atualiza o nome do usuário autenticado. E-mail não é mutável. */
    public UserResponse updateProfile(UUID id, UpdateUserRequest request) {
        User user = userRepository.findByAppId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));
        user.setName(request.name().trim());
        User saved = userRepository.save(user);
        log.info("Perfil atualizado: id={}", saved.getId());
        return UserResponse.from(saved);
    }

    /** Busca a entidade (uso interno, ex.: AuthService). */
    public User findEntityByEmail(String email) {
        return userRepository.findByEmail(normalize(email))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", "e-mail informado"));
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}