package it.andmora.expensesmonitor.backend.dao.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.dbmodel.TagDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.time.LocalDateTime;
import org.assertj.core.api.InstanceOfAssertFactories;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.internal.util.collections.Sets;

class PaymentDbMapperTest {

  LocalDateTime dateInjected = LocalDateTime.now();
  PaymentDbMapper mapper = Mappers.getMapper(PaymentDbMapper.class);

  @Test
  void whenMapFromDomainToDbEntityThenOk() {
    Payment payment = mapper.dbEntityToDomain(createDefaultEntity());

    assertThat(payment).extracting(Payment::getDescription).isEqualTo("shopping");
    assertThat(payment).extracting(Payment::getMerchantName).isEqualTo("H&M");
    assertThat(payment).extracting(Payment::getAmount).isEqualTo(1000);
    assertThat(payment).extracting(Payment::getAccountingDate).isEqualTo(dateInjected);
    assertThat(payment).extracting(Payment::getTags)
        .asInstanceOf(InstanceOfAssertFactories.collection(String.class))
        .containsExactlyInAnyOrder("tag1", "tag2");
  }

  @Test
  void givenNullTagsWhenMapFromDomainToDbEntityThenOk() {
    var dbEntity = createDefaultEntity();
    dbEntity.setTags(null);

    Payment payment = mapper.dbEntityToDomain(dbEntity);

    assertThat(payment).extracting(Payment::getDescription).isEqualTo("shopping");
    assertThat(payment).extracting(Payment::getMerchantName).isEqualTo("H&M");
    assertThat(payment).extracting(Payment::getAmount).isEqualTo(1000);
    assertThat(payment).extracting(Payment::getAccountingDate).isEqualTo(dateInjected);
    assertThat(payment).extracting(Payment::getTags)
        // workaround to assert on a Set
        .asInstanceOf(InstanceOfAssertFactories.collection(String.class))
        .isEmpty();
  }

  @Test
  void whenMapFromDbEntityToDomainThenOk() {
    PaymentDbEntity payment = mapper.domainToDbEntity(createDefaultPayment());

    assertThat(payment).extracting(PaymentDbEntity::getDescription).isEqualTo("shopping");
    assertThat(payment).extracting(PaymentDbEntity::getMerchantName).isEqualTo("H&M");
    assertThat(payment).extracting(PaymentDbEntity::getAmount).isEqualTo(1000);
    assertThat(payment).extracting(PaymentDbEntity::getAccountingDate).isEqualTo(dateInjected);
    assertThat(payment).extracting(PaymentDbEntity::getTags)
        .asInstanceOf(InstanceOfAssertFactories.collection(TagDbEntity.class))
        .containsExactlyInAnyOrder(TagDbEntity.builder().tagName("tag1").build(),
            TagDbEntity.builder().tagName("tag2").build());
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .tags(Sets.newSet("tag1", "tag2"))
        .build();
  }

  PaymentDbEntity createDefaultEntity() {
    return PaymentDbEntity.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .tags(Sets.newSet(
            TagDbEntity.builder().id(1).tagName("tag1").build(),
            TagDbEntity.builder().id(2).tagName("tag2").build()
        ))
        .build();
  }

}