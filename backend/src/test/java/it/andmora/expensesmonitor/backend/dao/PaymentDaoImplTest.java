package it.andmora.expensesmonitor.backend.dao;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.PaymentPostgresRepository;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.time.LocalDateTime;
import java.util.HashSet;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class PaymentDaoImplTest {

  @Mock
  PaymentPostgresRepository repository;
  PaymentDaoImpl paymentDao;
  AutoCloseable autoCloseable;
  LocalDateTime dateInjected = LocalDateTime.now();


  @BeforeEach
  void setup() {
    autoCloseable = MockitoAnnotations.openMocks(this);
    paymentDao = new PaymentDaoImpl(repository, Mappers.getMapper(PaymentDbMapper.class));
  }

  @AfterEach
  void cleanup() throws Exception {
    autoCloseable.close();
  }

  @Test
  void givenTwoOutcomePaymentsWhenGetOverallBalanceThenSum() {
    // given
    Mockito.when(repository.findAll()).thenReturn(createOutcomeResponse());

    // when
    Mono<Integer> overallBalance = paymentDao.getOverallBalance();

    // then
    StepVerifier
        .create(overallBalance)
        .expectNext(-400)
        .expectComplete()
        .verify();
  }

  @Test
  void givenTwoMixedPaymentsWhenGetOverallBalanceThenSum() {
    // given
    Mockito.when(repository.findAll()).thenReturn(createMixedResponse());

    // when
    Mono<Integer> overallBalance = paymentDao.getOverallBalance();

    // then
    StepVerifier
        .create(overallBalance)
        .expectNext(-200)
        .expectComplete()
        .verify();
  }

  @Test
  void givenTwoIncomePaymentsWhenGetOverallBalanceThenSum() {
    // given
    Mockito.when(repository.findAll()).thenReturn(createIncomeResponse());

    // when
    Mono<Integer> overallBalance = paymentDao.getOverallBalance();

    // then
    StepVerifier
        .create(overallBalance)
        .expectNext(500)
        .expectComplete()
        .verify();
  }

  @Test
  void givenAPaymentWhenSaveItThenGoesOk() {
    var payment = createDefaultPayment();
    Mockito.when(repository.save(any())).thenReturn(getSavedEntity());

    var paymentSaved = paymentDao.savePayment(payment);

    StepVerifier
        .create(paymentSaved)
        .expectNext(payment)
        .expectComplete()
        .verify();
  }

  @Test
  void givenAPaymentWhenDeleteItThenGoesOk() {
    Mockito.when(repository.deleteById(any(Integer.class))).thenReturn(Mono.empty());

    var paymentDeleted = paymentDao.deletePayment(0);

    Mockito.verify(repository).deleteById(any(Integer.class));
    StepVerifier
        .create(paymentDeleted)
        .expectComplete()
        .verify();
  }

  Flux<PaymentDbEntity> createOutcomeResponse() {
    return Flux.just(PaymentDbEntity.builder().id(1).amount(-100).build(),
        PaymentDbEntity.builder().id(2).amount(-300).build());
  }

  Flux<PaymentDbEntity> createMixedResponse() {
    return Flux.just(PaymentDbEntity.builder().id(1).amount(100).build(),
        PaymentDbEntity.builder().id(2).amount(-300).build());
  }

  Flux<PaymentDbEntity> createIncomeResponse() {
    return Flux.just(PaymentDbEntity.builder().id(1).amount(200).build(),
        PaymentDbEntity.builder().id(2).amount(300).build());
  }

  Mono<PaymentDbEntity> getSavedEntity() {
    return Mono.just(PaymentDbEntity.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .build());
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .build();
  }
}