package it.andmora.expensesmonitor.domain.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;

class PaymentCreatorTest {

  @Mock
  PaymentDao paymentDao;
  PaymentCreator paymentCreator;
  AutoCloseable autoCloseable;
  OffsetDateTime dateInjected = OffsetDateTime.now();

  @BeforeEach
  void setup() {
    autoCloseable = MockitoAnnotations.openMocks(this);

    paymentCreator = new PaymentCreatorImpl(paymentDao);
  }

  @AfterEach
  void cleanup() throws Exception {
    autoCloseable.close();
  }

  @Test
  void givenAPaymentWhenIsCreatedThenReturnsThePayment() {
    Payment paymentDefault = createDefaultPayment();
    Mockito.when(paymentDao.savePayment(paymentDefault)).thenReturn(Mono.just(paymentDefault));

    Mono<Payment> paymentResponse = paymentCreator.createPayment(paymentDefault);

    paymentResponse.subscribe(payment -> assertThat(payment).isEqualTo(paymentDefault));
  }

  Payment createDefaultPayment() {
    return Payment.builder().description("shopping").merchantName("Lidl")
        .paymentType(PaymentType.OUTCOME).accountingDate(dateInjected).build();
  }

}