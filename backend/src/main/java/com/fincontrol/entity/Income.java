package com.fincontrol.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Document(collection = "incomes")
@CompoundIndex(name = "idx_incomes_user_date", def = "{'user_id': 1, 'date': -1}")
@CompoundIndex(name = "idx_incomes_user_category", def = "{'user_id': 1, 'category': 1}")
public class Income {

    @Id
    private String id;

    @Field("app_id")
    private UUID appId = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    @Field("description")
    private String description;

    @Field("amount")
    private BigDecimal amount;

    @Field("date")
    private LocalDate date;

    @Field("category")
    private IncomeCategory category;

    @Field("recurrence")
    private Recurrence recurrence = Recurrence.UNICA;

    @Field("notes")
    private String notes;

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    public Income() { }

    public String getId() { return id; }
    public UUID getAppId() { return appId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public IncomeCategory getCategory() { return category; }
    public void setCategory(IncomeCategory category) { this.category = category; }
    public Recurrence getRecurrence() { return recurrence; }
    public void setRecurrence(Recurrence recurrence) { this.recurrence = recurrence; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
