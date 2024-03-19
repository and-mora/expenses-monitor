package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class PaymentCreatorTest {

  @Mock
  PaymentDao paymentDao;
  PaymentCreator paymentCreator;
  LocalDateTime dateInjected = LocalDateTime.now();

  @BeforeEach
  void setup() {
    paymentCreator = new PaymentCreatorImpl(paymentDao);
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