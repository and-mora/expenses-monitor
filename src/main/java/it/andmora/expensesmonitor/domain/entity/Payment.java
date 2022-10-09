package it.andmora.expensesmonitor.domain.entity;

import java.time.OffsetDateTime;
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
  private OffsetDateTime accountingDate;
  private PaymentType paymentType;
}
