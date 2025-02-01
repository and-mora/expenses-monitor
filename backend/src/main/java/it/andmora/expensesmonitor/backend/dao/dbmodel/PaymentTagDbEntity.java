package it.andmora.expensesmonitor.backend.dao.dbmodel;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.util.Collection;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("payments_tags")
@Builder
@Data
public class PaymentTagDbEntity {

  @Id
  private UUID id;
  private String key;
  private String value;
  private UUID paymentId;

  public static Collection<PaymentTagDbEntity> fromPayment(Payment payment) {
    return payment.tags().stream()
        .map(tag -> PaymentTagDbEntity.builder()
            .key(tag.key())
            .value(tag.value())
            .paymentId(payment.id())
            .build())
        .toList();
  }
}
