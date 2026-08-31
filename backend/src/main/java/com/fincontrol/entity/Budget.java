package com.fincontrol.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Limite mensal de gasto por categoria (documento MongoDB). */
@Document(collection = "budgets")
@CompoundIndex(name = "idx_budgets_user_category", def = "{'user_id': 1, 'category': 1}", unique = true)
public class Budget {

    @Id
    private String id;

    @Field("app_id")
    private UUID appId = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    @Field("category")
    private ExpenseCategory category;

    @Field("limit_amount")
    private BigDecimal limitAmount;

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    public Budget() { }

    public String getId() { return id; }
    public UUID getAppId() { return appId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory category) { this.category = category; }
    public BigDecimal getLimitAmount() { return limitAmount; }
    public void setLimitAmount(BigDecimal limitAmount) { this.limitAmount = limitAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
