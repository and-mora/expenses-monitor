package it.andmora.expensesmonitor.web.dto;

import java.time.LocalDateTime;
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
  private boolean isIncomeVoice;
}
