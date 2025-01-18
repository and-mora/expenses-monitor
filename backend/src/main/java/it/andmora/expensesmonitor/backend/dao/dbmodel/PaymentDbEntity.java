package it.andmora.expensesmonitor.backend.dao.dbmodel;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("payments")
@Builder
@Data
public class PaymentDbEntity {

  @Id
  private UUID id;
  private String description;
  @Column("amount")
  private int amountInCents;
  @Column("merchant_name")
  private String merchantName;
  @Column("accounting_date")
  private LocalDateTime accountingDate;
  private String category;
  private UUID wallet;
}
