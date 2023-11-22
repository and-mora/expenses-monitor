package it.andmora.expensesmonitor.backend.domain.usecase;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class PaymentDeleterTest {

  @Mock
  PaymentDao paymentDao;
  PaymentDeleter paymentDeleter;
  AutoCloseable autoCloseable;

  @BeforeEach
  void setup() {
    autoCloseable = MockitoAnnotations.openMocks(this);

    paymentDeleter = new PaymentDeleterImpl(paymentDao);
  }

  @AfterEach
  void cleanup() throws Exception {
    autoCloseable.close();
  }

  @Test
  void givenAnIdWhenAPaymentIsDeletedThenReturnsNothing() {
    Mockito.when(paymentDao.deletePayment(any())).thenReturn(Mono.empty());

    Mono<Void> paymentResponse = paymentDeleter.deletePayment(0);

    StepVerifier
        .create(paymentResponse)
        .expectComplete()
        .verify();
  }

}