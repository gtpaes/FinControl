package com.fincontrol.controller;

import com.fincontrol.dto.CategoryPoint;
import com.fincontrol.dto.DashboardSummaryResponse;
import com.fincontrol.dto.EvolucaoPoint;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.DashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Dashboard — números derivados de dados reais do usuário autenticado. */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.summary(principal.getId());
    }

    @GetMapping("/expenses-by-category")
    public List<CategoryPoint> despesasPorCategoria(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.despesasPorCategoria(principal.getId());
    }

    @GetMapping("/patrimony-evolution")
    public List<EvolucaoPoint> evolucaoPatrimonial(@AuthenticationPrincipal UserPrincipal principal,
                                                   @RequestParam(defaultValue = "6m") String periodo) {
        return dashboardService.evolucaoPatrimonial(principal.getId(), periodo);
    }
}
