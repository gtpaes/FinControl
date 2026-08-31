package com.fincontrol.repository;

import com.fincontrol.entity.Investment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Repositório de investimentos. Ownership: sempre filtrado por userId. */
public interface InvestmentRepository extends MongoRepository<Investment, String> {

    Optional<Investment> findByAppIdAndUserId(UUID appId, UUID userId);

    @Query(value = "{ 'user_id' : ?0 }", sort = "{ 'name' : 1 }")
    List<Investment> findAllByUserId(UUID userId);

    /** Lista completa (sem paginação) para agregações do dashboard/patrimônio. */
    List<Investment> findByUserId(UUID userId);
}
