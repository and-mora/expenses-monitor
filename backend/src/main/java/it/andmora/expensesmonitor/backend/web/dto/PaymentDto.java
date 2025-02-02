package it.andmora.expensesmonitor.backend.web.dto;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;
import lombok.Builder;

/**
 * Pojo used by the controller
 */
@Builder
public record PaymentDto(UUID id,
                         String description,
                         int amountInCents,
                         String merchantName,
                         LocalDateTime accountingDate,
                         String category,
                         String wallet,
                         Collection<TagDto> tags) {

}
