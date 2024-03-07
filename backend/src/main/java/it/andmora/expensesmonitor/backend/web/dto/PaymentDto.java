package it.andmora.expensesmonitor.backend.web.dto;

import java.time.LocalDateTime;

/**
 * Pojo used by the controller
 */
public record PaymentDto(int id,
                         String description,
                         int amountInCents,
                         String merchantName,
                         LocalDateTime accountingDate,
                         String category) {

}
