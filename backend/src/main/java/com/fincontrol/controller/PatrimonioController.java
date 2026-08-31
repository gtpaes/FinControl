package com.fincontrol.controller;

import com.fincontrol.dto.EvolucaoPoint;
import com.fincontrol.dto.PatrimonioResponse;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.PatrimonioService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Patrimônio — derivado de dados reais (sem collection própria). */
@RestController
@RequestMapping("/api/patrimony")
public class PatrimonioController {

    private final PatrimonioService patrimonioService;

    public PatrimonioController(PatrimonioService patrimonioService) {
        this.patrimonioService = patrimonioService;
    }

    @GetMapping
    public PatrimonioResponse patrimonio(@AuthenticationPrincipal UserPrincipal principal) {
        return patrimonioService.patrimonio(principal.getId());
    }

    @GetMapping("/evolution")
    public List<EvolucaoPoint> evolucao(@AuthenticationPrincipal UserPrincipal principal,
                                        @RequestParam(defaultValue = "6m") String periodo) {
        return patrimonioService.evolucao(principal.getId(), periodo);
    }
}
