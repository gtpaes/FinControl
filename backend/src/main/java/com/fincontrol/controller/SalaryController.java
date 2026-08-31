package com.fincontrol.controller;

import com.fincontrol.dto.CreateSalaryRequest;
import com.fincontrol.dto.SalaryResponse;
import com.fincontrol.dto.UpdateSalaryRequest;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.SalaryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * Endpoints de salário. Todos protegidos (Bearer token).
 * O proprietário vem do principal.Id() — nunca de parâmetro do frontend.
 */
@RestController
@RequestMapping("/api/salaries")
public class SalaryController {

    private final SalaryService salaryService;

    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    @PostMapping
    public ResponseEntity<SalaryResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                 @Valid @RequestBody CreateSalaryRequest request) {
        SalaryResponse created = salaryService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/salaries/" + created.id())).body(created);
    }

    @GetMapping
    public Page<SalaryResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                     @RequestParam(required = false) String referenceMonth,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return salaryService.list(principal.getId(), referenceMonth, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryResponse> findById(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable UUID id) {
        return ResponseEntity.ok(salaryService.findById(principal.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody UpdateSalaryRequest request) {
        return ResponseEntity.ok(salaryService.update(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        salaryService.delete(principal.getId(), id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}