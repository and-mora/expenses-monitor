package it.andmora.expensesmonitor.backend.web.mapper;

import static org.junit.jupiter.api.Assertions.*;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class PaymentControllerMapperTest {

  private final PaymentControllerMapper mapper = Mappers.getMapper(PaymentControllerMapper.class);

  @Test
  void dtoToEntity_shouldMapWalletName() {
    PaymentDto dto = PaymentDto.builder().wallet("My Wallet").build();

    Payment entity = mapper.dtoToEntity(dto);

    assertEquals("My Wallet", entity.wallet().name());
  }

  @Test
  void dtoToEntity_shouldInitializeTagsWithEmptyList() {
    PaymentDto dto = PaymentDto.builder().build();

    Payment entity = mapper.dtoToEntity(dto);

    assertNotNull(entity.tags());
    assertTrue(entity.tags().isEmpty());
  }

  @Test
  void entityToDto_shouldMapWalletId() {
    var uuid = UUID.randomUUID();
    Payment entity = Payment.builder().wallet(Wallet.builder().id(uuid).build()).build();

    PaymentDto dto = mapper.entityToDto(entity);

    assertEquals(uuid.toString(), dto.wallet());
  }
}