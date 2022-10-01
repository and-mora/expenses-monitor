package it.andmora.expensesmonitor.domain.entity;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Set;

/**
 * Domain object to represent the single payment
 */
@Data
public class Payment {
    String description;
    int amount;
    String merchantDescription;
    OffsetDateTime accountingDate;
    PaymentType paymentType;
    Set<String> tags;
}
