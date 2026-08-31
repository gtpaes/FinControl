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

@Document(collection = "salaries")
@CompoundIndex(name = "idx_salaries_user_reference", def = "{'user_id': 1, 'reference_month': -1}")
public class Salary {

    @Id
    private String id;

    @Field("app_id")
    private UUID appId = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    @Field("amount")
    private BigDecimal amount;

    @Field("description")
    private String description;

    @Field("reference_month")
    private String referenceMonth;

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    public Salary() { }

    public String getId() { return id; }
    public UUID getAppId() { return appId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReferenceMonth() { return referenceMonth; }
    public void setReferenceMonth(String referenceMonth) { this.referenceMonth = referenceMonth; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
