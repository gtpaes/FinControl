package com.fincontrol.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Aporte em um investimento (documento embutido em Investment). */
public class Aporte {

    private LocalDate date;

    /** Valor total do aporte. */
    private BigDecimal amount;

    /** Quantidade adquirida no aporte. */
    private BigDecimal quantity;

    public Aporte() { }

    public Aporte(LocalDate date, BigDecimal amount, BigDecimal quantity) {
        this.date = date;
        this.amount = amount;
        this.quantity = quantity;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
