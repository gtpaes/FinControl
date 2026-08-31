package com.fincontrol.repository;

import com.fincontrol.entity.Budget;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Repositório de orçamentos. Ownership: sempre filtrado por userId. */
public interface BudgetRepository extends MongoRepository<Budget, String> {

    Optional<Budget> findByAppIdAndUserId(UUID appId, UUID userId);

    Optional<Budget> findByUserIdAndCategory(UUID userId, com.fincontrol.entity.ExpenseCategory category);

    @Query(value = "{ 'user_id' : ?0 }", sort = "{ 'category' : 1 }")
    List<Budget> findAllByUserId(UUID userId);
}
