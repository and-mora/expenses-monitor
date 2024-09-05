package it.andmora.expensesmonitor.backend.domain.usecase;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class PaymentDeleterTest {

  @Mock
  PaymentDao paymentDao;
  PaymentDeleter paymentDeleter;

  @BeforeEach
  void setup() {
    paymentDeleter = new PaymentDeleterImpl(paymentDao);
  }

  @Test
  void givenAnIdWhenAPaymentIsDeletedThenReturnsNothing() {
    Mockito.when(paymentDao.deletePayment(any())).thenReturn(Mono.empty());

    Mono<Void> paymentResponse = paymentDeleter.deletePayment(UUID.randomUUID());

    StepVerifier
        .create(paymentResponse)
        .expectComplete()
        .verify();
  }

}