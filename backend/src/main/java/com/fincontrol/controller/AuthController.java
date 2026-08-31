package com.fincontrol.controller;

import com.fincontrol.dto.AuthResponse;
import com.fincontrol.dto.LoginRequest;
import com.fincontrol.dto.RegisterRequest;
import com.fincontrol.dto.UpdateUserRequest;
import com.fincontrol.dto.UserResponse;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.AuthService;
import com.fincontrol.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Endpoints de autenticação.
 *
 * O controller apenas mapeia HTTP <-> service. Sem regras de negócio aqui.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /** Cadastro público. 201 Created + dados públicos do usuário. */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse created = userService.register(request);
        return ResponseEntity
                .created(URI.create("/api/auth/me"))
                .body(created);
    }

    /** Login público. 200 OK + JWT + dados públicos do usuário. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

        /** Dados do usuário autenticado. Protegido (exige Bearer token). */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.findById(principal.getId()));
    }

    /** Atualiza o perfil do usuário autenticado. Protegido (exige Bearer token). */

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

}