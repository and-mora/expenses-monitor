package it.andmora.expensesmonitor.web.dto;

import java.time.LocalDateTime;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

/**
 * Pojo used by the controller
 */
@Builder
@Data
public class PaymentDto {

  private String description;
  private int amount;
  private String merchantName;
  private LocalDateTime accountingDate;
  private String category;
  private Set<String> tags;
}
