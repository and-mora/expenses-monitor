package it.andmora.expensesmonitor.backend.web.dto;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Pojo used by the controller
 */
public record PaymentDto(String description,
                         int amount,
                         String merchantName,
                         LocalDateTime accountingDate,
                         String category) {

}
