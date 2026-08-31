package com.fincontrol.controller;

import com.fincontrol.dto.ReportPoint;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.ReportService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Relatórios — agregações mensais reais de incomes/expenses/aportes. */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<ReportPoint> relatorio(@AuthenticationPrincipal UserPrincipal principal,
                                       @RequestParam(defaultValue = "mes") String periodo) {
        return reportService.relatorio(principal.getId(), periodo);
    }
}
