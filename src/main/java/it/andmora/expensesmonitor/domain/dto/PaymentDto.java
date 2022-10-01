package it.andmora.expensesmonitor.domain.dto;

import lombok.Builder;

import java.time.OffsetDateTime;
import java.util.Set;

/**
 * Pojo to communicate the request model from PaymentCreation use case
 */
@Builder
public class PaymentDto {
    String description;
    int amount;
    String merchantDescription;
    OffsetDateTime accountingDate;
    Set<String> tags;
}
