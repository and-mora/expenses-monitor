package it.andmora.expensesmonitor.dao.dbmodel;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Table;

@Table("paymentTags")
@Builder
@Data
public class PaymentTagsDbEntity {

  @Transient
  private TagDbEntity tag;
  @Transient
  private PaymentDbEntity payment;

}
