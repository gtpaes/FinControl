package com.fincontrol.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Ativo da carteira de investimentos (documento MongoDB). */
@Document(collection = "investments")
@CompoundIndex(name = "idx_investments_user", def = "{'user_id': 1, 'ticker': 1}")
public class Investment {

    @Id
    private String id;

    @Field("app_id")
    private UUID appId = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    @Field("ticker")
    private String ticker;

    @Field("name")
    private String name;

    @Field("type")
    private InvestmentType type;

    @Field("quantity")
    private BigDecimal quantity;

    @Field("avg_price")
    private BigDecimal avgPrice;

    /** Preço de mercado atual — informado/atualizado pelo usuário (sem API paga). */
    @Field("current_price")
    private BigDecimal currentPrice;

    @Field("aportes")
    private List<Aporte> aportes = new ArrayList<>();

    @Field("created_at")
    @CreatedDate
    private Instant createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private Instant updatedAt;

    public Investment() { }

    public String getId() { return id; }
    public UUID getAppId() { return appId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public InvestmentType getType() { return type; }
    public void setType(InvestmentType type) { this.type = type; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getAvgPrice() { return avgPrice; }
    public void setAvgPrice(BigDecimal avgPrice) { this.avgPrice = avgPrice; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }
    public List<Aporte> getAportes() { return aportes; }
    public void setAportes(List<Aporte> aportes) { this.aportes = aportes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
