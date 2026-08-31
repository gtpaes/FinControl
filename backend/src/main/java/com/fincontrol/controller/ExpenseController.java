package com.fincontrol.controller;

import com.fincontrol.dto.CreateExpenseRequest;
import com.fincontrol.dto.ExpenseResponse;
import com.fincontrol.dto.UpdateExpenseRequest;
import com.fincontrol.entity.ExpenseCategory;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.ExpenseService;
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

/** Endpoints protegidos de despesas. Ownership via principal.Id(). */
@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                  @Valid @RequestBody CreateExpenseRequest request) {
        ExpenseResponse created = expenseService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/expenses/" + created.id())).body(created);
    }

    @GetMapping
    public Page<ExpenseResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                      @RequestParam(required = false) ExpenseCategory category,
                                      @RequestParam(required = false)
                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                      @RequestParam(required = false)
                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return expenseService.list(principal.getId(), category, dateFrom, dateTo, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> findById(@AuthenticationPrincipal UserPrincipal principal,
                                                    @PathVariable UUID id) {
        return ResponseEntity.ok(expenseService.findById(principal.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody UpdateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.update(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        expenseService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}