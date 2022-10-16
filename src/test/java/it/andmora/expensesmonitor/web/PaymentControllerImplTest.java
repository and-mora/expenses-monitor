package it.andmora.expensesmonitor.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.web.dto.PaymentDto;
import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import it.andmora.expensesmonitor.web.mapper.PaymentMapper;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

class PaymentControllerImplTest {


  PaymentMapper paymentMapper = Mappers.getMapper(PaymentMapper.class);
  @Mock
  PaymentCreator paymentCreator;
  PaymentController paymentController;

  OffsetDateTime dateInjected = OffsetDateTime.now();
  AutoCloseable closeable;

  @BeforeEach
  void setup() {
    closeable = MockitoAnnotations.openMocks(this);

    paymentController = new PaymentControllerImpl(paymentCreator, paymentMapper);
  }

  @AfterEach
  void cleanup() throws Exception {
    closeable.close();
  }

  @Test
  void whenCreatePaymentThenReturnExpectedFields() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(createDefaultPayment());
    PaymentDto paymentDto = createPaymentDto();

    PaymentDto paymentResponse = paymentController.createPayment(paymentDto);

    assertThat(paymentResponse).extracting("description").isEqualTo("shopping");
    assertThat(paymentResponse).extracting("merchantName").isEqualTo("H&M");
    assertThat(paymentResponse).extracting("amount").isEqualTo(1000);
    assertThat(paymentResponse).extracting("accountingDate").isEqualTo(dateInjected);
    assertThat(paymentResponse).extracting("isIncomeVoice").isEqualTo(false);
  }

  PaymentDto createPaymentDto() {
    return PaymentDto.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .isIncomeVoice(false).build();
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .paymentType(PaymentType.OUTCOME).build();
  }

}