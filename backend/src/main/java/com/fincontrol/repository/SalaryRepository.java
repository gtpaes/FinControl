package com.fincontrol.repository;

import com.fincontrol.entity.Salary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositório de salários.
 * OWNERSHIP: todos os métodos incluem userId na consulta.
 * Consulta pelo app_id (UUID de aplicação), não pelo _id interno do MongoDB.
 */
public interface SalaryRepository extends MongoRepository<Salary, String> {

    Optional<Salary> findByAppIdAndUserId(UUID appId, UUID userId);

    @Query(value = "{ 'user_id' : ?0 }", sort = "{ 'reference_month' : -1 }")
    Page<Salary> findAllByUserId(UUID userId, Pageable pageable);
}
