package it.andmora.expensesmonitor.dao.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import it.andmora.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.backend.dao.dbmodel.TagDbEntity;
import it.andmora.backend.dao.mapper.PaymentDbMapper;
import it.andmora.backend.domain.model.Payment;
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

    assertThat(payment).extracting("description").isEqualTo("shopping");
    assertThat(payment).extracting("merchantName").isEqualTo("H&M");
    assertThat(payment).extracting("amount").isEqualTo(1000);
    assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
    assertThat(payment).extracting("tags")
        .asInstanceOf(InstanceOfAssertFactories.collection(String.class))
        .containsExactlyInAnyOrder("tag1", "tag2");
  }

  @Test
  void whenMapFromDbEntityToDomainThenOk() {
    PaymentDbEntity payment = mapper.domainToDbEntity(createDefaultPayment());

    assertThat(payment).extracting("description").isEqualTo("shopping");
    assertThat(payment).extracting("merchantName").isEqualTo("H&M");
    assertThat(payment).extracting("amount").isEqualTo(1000);
    assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
    assertThat(payment).extracting("tags")
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