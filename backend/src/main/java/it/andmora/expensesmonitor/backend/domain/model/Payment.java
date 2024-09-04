package it.andmora.expensesmonitor.backend.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * Domain object to represent the single payment
 */
@Builder
@Data
public class Payment {

  private UUID id;
  private String description;
  private int amountInCents;
  private String merchantName;
  private LocalDateTime accountingDate;
  private String category;
}
