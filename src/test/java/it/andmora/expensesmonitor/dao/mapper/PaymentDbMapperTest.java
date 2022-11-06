package it.andmora.expensesmonitor.dao.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.domain.entity.Payment;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class PaymentDbMapperTest {

  LocalDateTime dateInjected = LocalDateTime.now();
  PaymentDbMapper mapper = Mappers.getMapper(PaymentDbMapper.class);

  @Test
  void whenMapFromDomainToDbEntityThenOk() {
    Payment payment = mapper.dbEntityToDomain(createDefaultEntity());

    assertThat(payment).extracting("description").isEqualTo("shopping");
    assertThat(payment).extracting("merchantName").isEqualTo("H&M");
    assertThat(payment).extracting("amount").isEqualTo(1000);
    assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
  }

  @Test
  void whenMapFromDbEntityToDomainThenOk() {
    PaymentDbEntity payment = mapper.domainToDbEntity(createDefaultPayment());

    assertThat(payment).extracting("description").isEqualTo("shopping");
    assertThat(payment).extracting("merchantName").isEqualTo("H&M");
    assertThat(payment).extracting("amount").isEqualTo(1000);
    assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .build();
  }

  PaymentDbEntity createDefaultEntity() {
    return PaymentDbEntity.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .build();
  }

}