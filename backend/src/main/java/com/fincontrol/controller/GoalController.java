package com.fincontrol.controller;

import com.fincontrol.dto.CreateGoalRequest;
import com.fincontrol.dto.GoalResponse;
import com.fincontrol.dto.UpdateGoalRequest;
import com.fincontrol.security.UserPrincipal;
import com.fincontrol.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/** Endpoints protegidos de metas. Ownership via principal.getId(). */
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody CreateGoalRequest request) {
        GoalResponse created = goalService.create(principal.getId(), request);
        return ResponseEntity.created(URI.create("/api/goals/" + created.id())).body(created);
    }

    @GetMapping
    public List<GoalResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return goalService.list(principal.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponse> findById(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable UUID id) {
        return ResponseEntity.ok(goalService.findById(principal.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                               @PathVariable UUID id,
                                               @Valid @RequestBody UpdateGoalRequest request) {
        return ResponseEntity.ok(goalService.update(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable UUID id) {
        goalService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
