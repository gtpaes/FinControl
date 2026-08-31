package com.fincontrol.service;

import com.fincontrol.dto.CreateGoalRequest;
import com.fincontrol.dto.GoalResponse;
import com.fincontrol.dto.UpdateGoalRequest;
import com.fincontrol.entity.Goal;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.repository.GoalRepository;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    public GoalResponse create(UUID userId, CreateGoalRequest request) {
        Goal goal = new Goal();
        goal.setUserId(userId);
        apply(goal, request.name(), request.targetAmount(), request.currentAmount(),
                request.deadline(), request.color());
        return GoalResponse.from(goalRepository.save(goal));
    }

    public List<GoalResponse> list(UUID userId) {
        return goalRepository.findAllByUserId(userId).stream().map(GoalResponse::from).toList();
    }

    public GoalResponse findById(UUID userId, UUID id) {
        return GoalResponse.from(getOwned(userId, id));
    }

    public GoalResponse update(UUID userId, UUID id, UpdateGoalRequest request) {
        Goal goal = getOwned(userId, id);
        apply(goal, request.name(), request.targetAmount(), request.currentAmount(),
                request.deadline(), request.color());
        return GoalResponse.from(goalRepository.save(goal));
    }

    public void delete(UUID userId, UUID id) {
        goalRepository.delete(getOwned(userId, id));
    }

    private Goal getOwned(UUID userId, UUID id) {
        return goalRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta", id));
    }

    private void apply(Goal goal, String name, java.math.BigDecimal target,
                       java.math.BigDecimal current, java.time.LocalDate deadline, String color) {
        goal.setName(name.trim());
        goal.setTargetAmount(target.setScale(2, RoundingMode.HALF_UP));
        goal.setCurrentAmount(current.setScale(2, RoundingMode.HALF_UP));
        goal.setDeadline(deadline);
        goal.setColor(color == null || color.isBlank() ? "brand" : color);
    }
}
