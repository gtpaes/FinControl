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

@Document(collection = "expenses")
@CompoundIndex(name = "idx_expenses_user_date", def = "{'user_id': 1, 'date': -1}")
@CompoundIndex(name = "idx_expenses_user_category", def = "{'user_id': 1, 'category': 1}")
public class Expense {

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
    private ExpenseCategory category;

    @Field("type")
    private ExpenseType type = ExpenseType.VARIAVEL;

    @Field("status")
    private ExpenseStatus status = ExpenseStatus.PAGA;

    @Field("recurring")
    private boolean recurring;

    @Field("notes")
    private String notes;

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    public Expense() { }

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
    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory category) { this.category = category; }
    public ExpenseType getType() { return type; }
    public void setType(ExpenseType type) { this.type = type; }
    public ExpenseStatus getStatus() { return status; }
    public void setStatus(ExpenseStatus status) { this.status = status; }
    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
