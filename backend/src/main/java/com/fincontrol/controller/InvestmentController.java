package com.fincontrol.controller;

import com.fincontrol.dto.AddAporteRequest;
import com.fincontrol.dto.CreateInvestmentRequest;
import com.fincontrol.dto.EvolucaoPoint;
import com.fincontrol.dto.InvestmentResponse;
import com.fincontrol.dto.InvestmentEvolucaoPoint;
import com.fincontrol.dto.InvestmentSummaryResponse;
import com.fincontrol.dto.UpdateInvestmentRequest;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.InvestmentService;
import com.fincontrol.service.InvestmentSummaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/** Endpoints protegidos de investimentos/carteira. Ownership via principal.getId(). */
@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    private final InvestmentService investmentService;
    private final InvestmentSummaryService investmentSummaryService;

    public InvestmentController(InvestmentService investmentService,
                                InvestmentSummaryService investmentSummaryService) {
        this.investmentService = investmentService;
        this.investmentSummaryService = investmentSummaryService;
    }

    @PostMapping
    public ResponseEntity<InvestmentResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                     @Valid @RequestBody CreateInvestmentRequest request) {
        InvestmentResponse created = investmentService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/investments/" + created.id())).body(created);
    }

    @GetMapping
    public List<InvestmentResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return investmentService.list(principal.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestmentResponse> findById(@AuthenticationPrincipal UserPrincipal principal,
                                                       @PathVariable UUID id) {
        return ResponseEntity.ok(investmentService.findById(principal.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestmentResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable UUID id,
                                                     @Valid @RequestBody UpdateInvestmentRequest request) {
        return ResponseEntity.ok(investmentService.update(principal.getId(), id, request));
    }

    @PostMapping("/{id}/aportes")
    public ResponseEntity<InvestmentResponse> addAporte(@AuthenticationPrincipal UserPrincipal principal,
                                                        @PathVariable UUID id,
                                                        @Valid @RequestBody AddAporteRequest request) {
        return ResponseEntity.ok(investmentService.addAporte(principal.getId(), id, request));
    }

    @GetMapping("/evolution")
    public List<InvestmentEvolucaoPoint> evolucao(@AuthenticationPrincipal UserPrincipal principal,
                                        @RequestParam(defaultValue = "12") int meses) {
        return investmentService.evolucao(principal.getId(), Math.min(Math.max(meses, 1), 60));
    }

    @GetMapping("/summary")
    public InvestmentSummaryResponse summary(@AuthenticationPrincipal UserPrincipal principal) {
        return investmentSummaryService.summary(principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        investmentService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
