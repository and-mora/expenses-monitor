package it.andmora.expensesmonitor.controller.dto;

import java.time.OffsetDateTime;
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
  private OffsetDateTime accountingDate;
  private boolean isIncomeVoice;
}
