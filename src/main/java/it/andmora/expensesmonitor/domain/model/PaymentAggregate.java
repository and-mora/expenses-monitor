package it.andmora.expensesmonitor.domain.model;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class PaymentAggregate {

  private String aggregationField;

  private int amount;
}
