package com.fincontrol.repository;

import com.fincontrol.entity.Income;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório de receitas.
 * OWNERSHIP: consultas sempre filtradas por userId.
 * Consulta pelo app_id (UUID de aplicação).
 */
public interface IncomeRepository extends MongoRepository<Income, String> {

    Optional<Income> findByAppIdAndUserId(UUID appId, UUID userId);

    @Query(value = "{ 'user_id' : ?0 }", sort = "{ 'date' : -1 }")
    Page<Income> findAllByUserId(UUID userId, Pageable pageable);

    /** Lista completa (sem paginação) para agregações do dashboard/patrimônio. */
    List<Income> findByUserId(UUID userId);
}
