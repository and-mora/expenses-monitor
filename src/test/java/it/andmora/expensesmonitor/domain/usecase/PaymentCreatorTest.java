package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import java.time.LocalDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class PaymentCreatorTest {

  @Mock
  PaymentDao paymentDao;
  PaymentCreator paymentCreator;
  AutoCloseable autoCloseable;
  LocalDateTime dateInjected = LocalDateTime.now();

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

    StepVerifier
        .create(paymentResponse)
        .expectNext(paymentDefault)
        .expectComplete()
        .verify();
  }

  Payment createDefaultPayment() {
    return Payment.builder().description("shopping").merchantName("Lidl")
        .accountingDate(dateInjected).build();
  }

}