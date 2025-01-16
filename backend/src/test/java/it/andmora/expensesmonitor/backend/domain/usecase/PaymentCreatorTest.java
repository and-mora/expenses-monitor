package it.andmora.expensesmonitor.backend.domain.usecase;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.WalletNotFoundException;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
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
  @Mock
  WalletDao walletDao;
  PaymentCreator paymentCreator;
  LocalDateTime dateInjected = LocalDateTime.now();

  @BeforeEach
  void setup() {
    paymentCreator = new PaymentCreatorImpl(paymentDao, walletDao);
  }

  @Test
  void givenAPaymentWhenIsCreatedThenReturnsThePayment() {
    Payment paymentDefault = createDefaultPayment();
    Mockito.when(paymentDao.savePayment(paymentDefault)).thenReturn(Mono.just(paymentDefault));
    Mockito.when(walletDao.findByName(any())).thenReturn(Mono.just(Wallet.builder().name("wallet").build()));

    Mono<Payment> paymentResponse = paymentCreator.createPayment(paymentDefault);

    StepVerifier
        .create(paymentResponse)
        .expectNext(paymentDefault)
        .expectComplete()
        .verify();
  }

  @Test
  void givenAPaymentWhenWalletNotFoundThenThrowsException() {
    Payment paymentDefault = createDefaultPayment();
    Mockito.when(walletDao.findByName(any())).thenReturn(Mono.empty());

    Mono<Payment> paymentResponse = paymentCreator.createPayment(paymentDefault);

    StepVerifier
        .create(paymentResponse)
        .expectError(WalletNotFoundException.class)
        .verify();
  }
  Payment createDefaultPayment() {
    return Payment.builder().description("shopping").merchantName("Lidl")
        .accountingDate(dateInjected).wallet(Wallet.builder().name("wallet").build()).build();
  }

}