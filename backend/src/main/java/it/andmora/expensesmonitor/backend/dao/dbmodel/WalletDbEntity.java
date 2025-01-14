package it.andmora.expensesmonitor.backend.dao.dbmodel;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("wallets")
@Builder
@Data
public class WalletDbEntity {

  @Id
  private UUID id;
  private String name;

}
