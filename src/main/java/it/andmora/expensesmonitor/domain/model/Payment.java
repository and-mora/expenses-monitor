package it.andmora.expensesmonitor.domain.model;

import java.time.LocalDateTime;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

/**
 * Domain object to represent the single payment
 */
@Builder
@Data
public class Payment {

  private String description;
  private int amount;
  private String merchantName;
  private LocalDateTime accountingDate;
  private Set<String> tags;
}
