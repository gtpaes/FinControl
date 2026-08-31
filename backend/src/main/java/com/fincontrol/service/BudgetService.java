package com.fincontrol.service;

import com.fincontrol.dto.BudgetResponse;
import com.fincontrol.dto.CreateBudgetRequest;
import com.fincontrol.entity.Budget;
import com.fincontrol.entity.ExpenseCategory;
import com.fincontrol.exception.BusinessConflictException;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.repository.BudgetRepository;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    public BudgetResponse create(UUID userId, CreateBudgetRequest request) {
        if (budgetRepository.findByUserIdAndCategory(userId, request.category()).isPresent()) {
            throw new BusinessConflictException("Já existe um orçamento para esta categoria");
        }
        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setCategory(request.category());
        budget.setLimitAmount(request.limitAmount().setScale(2, RoundingMode.HALF_UP));
        return BudgetResponse.from(budgetRepository.save(budget));
    }

    public List<BudgetResponse> list(UUID userId) {
        return budgetRepository.findAllByUserId(userId).stream().map(BudgetResponse::from).toList();
    }

    public BudgetResponse update(UUID userId, UUID id, CreateBudgetRequest request) {
        Budget budget = budgetRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento", id));
        budget.setCategory(request.category());
        budget.setLimitAmount(request.limitAmount().setScale(2, RoundingMode.HALF_UP));
        return BudgetResponse.from(budgetRepository.save(budget));
    }

    public void delete(UUID userId, UUID id) {
        Budget budget = budgetRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento", id));
        budgetRepository.delete(budget);
    }
}
