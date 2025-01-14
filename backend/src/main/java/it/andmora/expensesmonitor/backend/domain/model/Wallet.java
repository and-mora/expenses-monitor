package it.andmora.expensesmonitor.backend.domain.model;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class Wallet {
  private UUID id;
  private String name;
}
