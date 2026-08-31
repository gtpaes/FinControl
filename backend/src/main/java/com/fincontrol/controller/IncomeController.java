package com.fincontrol.controller;

import com.fincontrol.dto.CreateIncomeRequest;
import com.fincontrol.dto.IncomeResponse;
import com.fincontrol.dto.UpdateIncomeRequest;
import com.fincontrol.entity.IncomeCategory;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.IncomeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
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
import java.time.LocalDate;
import java.util.UUID;

/** Endpoints protegidos de receitas. Ownership via principal.Id(). */
@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @PostMapping
    public ResponseEntity<IncomeResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                 @Valid @RequestBody CreateIncomeRequest request) {
        IncomeResponse created = incomeService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/incomes/" + created.id())).body(created);
    }

    @GetMapping
    public Page<IncomeResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                     @RequestParam(required = false) IncomeCategory category,
                                     @RequestParam(required = false)
                                     @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                     @RequestParam(required = false)
                                     @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return incomeService.list(principal.getId(), category, dateFrom, dateTo, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncomeResponse> findById(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable UUID id) {
        return ResponseEntity.ok(incomeService.findById(principal.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody UpdateIncomeRequest request) {
        return ResponseEntity.ok(incomeService.update(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        incomeService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}