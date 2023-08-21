package it.andmora.expensesmonitor.dao.dbmodel;

import java.time.LocalDateTime;
import java.util.Set;
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
  private int id;
  private String description;
  private int amount;
  @Column("merchant_name")
  private String merchantName;
  @Column("accounting_date")
  private LocalDateTime accountingDate;
  private String category;
  private Set<TagDbEntity> tags;
}
