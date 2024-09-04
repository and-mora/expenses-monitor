package it.andmora.expensesmonitor.backend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Pojo used by the controller
 */
public record PaymentDto(UUID id,
                         String description,
                         int amountInCents,
                         String merchantName,
                         LocalDateTime accountingDate,
                         String category) {

}
