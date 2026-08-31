package com.fincontrol.repository;

import com.fincontrol.entity.Goal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Repositório de metas. Ownership: sempre filtrado por userId. */
public interface GoalRepository extends MongoRepository<Goal, String> {

    Optional<Goal> findByAppIdAndUserId(UUID appId, UUID userId);

    @Query(value = "{ 'user_id' : ?0 }", sort = "{ 'deadline' : 1 }")
    List<Goal> findAllByUserId(UUID userId);
}
