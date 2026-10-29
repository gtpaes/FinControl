package com.fincontrol.controller;

import com.fincontrol.dto.AiAnalyzeRequest;
import com.fincontrol.dto.AiAnalyzeResponse;
import com.fincontrol.dto.InsightResponse;
import com.fincontrol.dto.NotificationResponse;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.AssistantService;
import com.fincontrol.service.InsightsService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Insights, notificações e assistente — derivados de dados reais do usuário
 * autenticado. Nenhum dado fictício.
 */
@RestController
@RequestMapping("/api")
public class InsightsController {

    private final InsightsService insightsService;
    private final AssistantService assistantService;

    public InsightsController(InsightsService insightsService, AssistantService assistantService) {
        this.insightsService = insightsService;
        this.assistantService = assistantService;
    }

    @GetMapping("/insights")
    public List<InsightResponse> insights(@AuthenticationPrincipal UserPrincipal principal) {
        return insightsService.insights(principal.getId());
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> notifications(@AuthenticationPrincipal UserPrincipal principal) {
        return insightsService.notifications(principal.getId());
    }

    @PostMapping("/ai/analyze")
    public AiAnalyzeResponse analyze(@AuthenticationPrincipal UserPrincipal principal,
                                     @Valid @RequestBody AiAnalyzeRequest request) {
        return assistantService.reply(principal.getId(), request);
    }
}
