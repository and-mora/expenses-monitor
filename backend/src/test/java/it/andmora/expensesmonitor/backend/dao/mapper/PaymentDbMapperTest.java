package it.andmora.expensesmonitor.backend.dao.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class PaymentDbMapperTest {

  LocalDateTime dateInjected = LocalDateTime.now();
  PaymentDbMapper mapper = Mappers.getMapper(PaymentDbMapper.class);

  @Test
  void whenMapFromDbEntityToDomainThenOk() {
    Payment payment = mapper.dbEntityToDomain(createDefaultEntity());

    assertThat(payment).extracting(Payment::description).isEqualTo("shopping");
    assertThat(payment).extracting(Payment::merchantName).isEqualTo("H&M");
    assertThat(payment).extracting(Payment::amountInCents).isEqualTo(1000);
    assertThat(payment).extracting(Payment::accountingDate).isEqualTo(dateInjected);
  }

  @Test
  void whenMapFromDomainToDbEntityThenOk() {
    PaymentDbEntity payment = mapper.domainToDbEntity(createDefaultPayment());

    assertThat(payment).extracting(PaymentDbEntity::getDescription).isEqualTo("shopping");
    assertThat(payment).extracting(PaymentDbEntity::getMerchantName).isEqualTo("H&M");
    assertThat(payment).extracting(PaymentDbEntity::getAmountInCents).isEqualTo(1000);
    assertThat(payment).extracting(PaymentDbEntity::getAccountingDate).isEqualTo(dateInjected);
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .build();
  }

  PaymentDbEntity createDefaultEntity() {
    return PaymentDbEntity.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .build();
  }

}