package it.andmora.expensesmonitor.backend.dao;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.PaymentPostgresRepository;
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
}