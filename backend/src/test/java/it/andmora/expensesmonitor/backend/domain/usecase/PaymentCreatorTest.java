package it.andmora.expensesmonitor.backend.domain.usecase;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.WalletNotFoundException;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.time.LocalDateTime;
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
    var walletId = UUID.randomUUID();
    var inputPayment = createDefaultPayment();
    var paymentToSave = Payment.builder().description("shopping").merchantName("Lidl")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().id(walletId).name("wallet").build())
        .build();

    Mockito.when(walletDao.findByName(any()))
        .thenReturn(Mono.just(Wallet.builder().id(walletId).name("wallet").build()));
    Mockito.when(paymentDao.savePayment(paymentToSave)).thenReturn(Mono.just(paymentToSave));

    Mono<Payment> paymentResponse = paymentCreator.createPayment(inputPayment);

    StepVerifier
        .create(paymentResponse)
        .expectNext(paymentToSave)
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
    return Payment.builder().description("shopping").merchantName("Lidl").amountInCents(1000)
        .accountingDate(dateInjected).wallet(Wallet.builder().name("wallet").build()).build();
  }

}