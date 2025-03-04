package it.andmora.expensesmonitor.backend.dao;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentTagDbEntity;
import it.andmora.expensesmonitor.backend.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.backend.dao.mapper.PaymentTagDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.PaymentPostgresRepository;
import it.andmora.expensesmonitor.backend.dao.persistance.PaymentTagRepository;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.model.Tag;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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
  @Mock
  PaymentTagRepository paymentTagRepository;
  PaymentDaoImpl paymentDao;
  AutoCloseable autoCloseable;
  LocalDateTime dateInjected = LocalDateTime.now();
  UUID injectedUUID = UUID.randomUUID();

  @BeforeEach
  void setup() {
    autoCloseable = MockitoAnnotations.openMocks(this);
    paymentDao = new PaymentDaoImpl(repository, paymentTagRepository,
        Mappers.getMapper(PaymentDbMapper.class), Mappers.getMapper(PaymentTagDbMapper.class));
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

    var inputPayment = createDefaultPayment();
    var expectedPayment = Payment.builder()
        .id(injectedUUID)
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().id(injectedUUID).build())
        .tags(List.of(new Tag(injectedUUID, "key", "value"),
            new Tag(injectedUUID, "chiave", "valore")))
        .build();
    Mockito.when(repository.save(any())).thenReturn(getSavedEntity());
    Mockito.when(paymentTagRepository.save(any())).thenReturn(
        Mono.just(
            PaymentTagDbEntity.builder().id(injectedUUID).paymentId(injectedUUID).key("key").value("value").build()),
        Mono.just(PaymentTagDbEntity.builder().id(injectedUUID).paymentId(injectedUUID).key("chiave").value("valore")
            .build()));

    var paymentSaved = paymentDao.savePayment(inputPayment);

    StepVerifier
        .create(paymentSaved)
        .expectNext(expectedPayment)
        .expectComplete()
        .verify();

    verify(repository, times(1)).save(any());
    verify(paymentTagRepository, times(2)).save(any());
  }

  @Test
  void givenAPaymentWithoutTagsWhenSaveItThenGoesOk() {

    var inputPayment = createDefaultPaymentWithoutTags();
    var expectedPayment = Payment.builder()
        .id(injectedUUID)
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().id(injectedUUID).build())
        .tags(List.of())
        .build();
    Mockito.when(repository.save(any())).thenReturn(getSavedEntity());
    Mockito.when(paymentTagRepository.save(any())).thenReturn(Mono.empty());

    var paymentSaved = paymentDao.savePayment(inputPayment);

    StepVerifier
        .create(paymentSaved)
        .expectNext(expectedPayment)
        .expectComplete()
        .verify();

    verify(repository, times(1)).save(any());
    verify(paymentTagRepository, times(0)).save(any());
  }

  @Test
  void givenAPaymentWhenDeleteItThenGoesOk() {
    Mockito.when(repository.deleteById(any(UUID.class))).thenReturn(Mono.empty());

    var paymentDeleted = paymentDao.deletePayment(UUID.randomUUID());

    verify(repository).deleteById(any(UUID.class));
    StepVerifier
        .create(paymentDeleted)
        .expectComplete()
        .verify();
  }

  @Test
  void whenGetCategoriesThenReturnFlux() {
    Mockito.when(repository.getCategories()).thenReturn(Flux.just("foo", "bar"));

    var categories = paymentDao.getCategories();

    verify(repository).getCategories();
    StepVerifier
        .create(categories)
        .expectNext("foo", "bar")
        .expectComplete()
        .verify();
  }

  Flux<PaymentDbEntity> createOutcomeResponse() {
    return Flux.just(PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(-100).build(),
        PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(-300).build());
  }

  Flux<PaymentDbEntity> createMixedResponse() {
    return Flux.just(PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(100).build(),
        PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(-300).build());
  }

  Flux<PaymentDbEntity> createIncomeResponse() {
    return Flux.just(PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(200).build(),
        PaymentDbEntity.builder().id(UUID.randomUUID()).amountInCents(300).build());
  }

  Mono<PaymentDbEntity> getSavedEntity() {
    return Mono.just(PaymentDbEntity.builder()
        .id(injectedUUID)
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .walletId(injectedUUID)
        .build());
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().name("wallet").build())
        .tags(List.of(Tag.builder().key("key").value("value").build(),
            Tag.builder().key("chiave").value("valore").build()))
        .build();
  }

  Payment createDefaultPaymentWithoutTags() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().name("wallet").build())
        .tags(List.of())
        .build();
  }
}