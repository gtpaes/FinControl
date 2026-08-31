package com.fincontrol.controller;

import com.fincontrol.dto.BudgetResponse;
import com.fincontrol.dto.CreateBudgetRequest;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/** Endpoints protegidos de orçamentos (limites por categoria). */
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                 @Valid @RequestBody CreateBudgetRequest request) {
        BudgetResponse created = budgetService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/budgets/" + created.id())).body(created);
    }

    @GetMapping
    public List<BudgetResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return budgetService.list(principal.getId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody CreateBudgetRequest request) {
        return ResponseEntity.ok(budgetService.update(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        budgetService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
