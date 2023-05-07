package it.andmora.expensesmonitor.dao.persistance;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import java.time.LocalDateTime;
import java.util.Objects;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

@Testcontainers
@DataMongoTest
class ReportMongoRepositoryTest {

  @Container
  public static final MongoDBContainer mongoContainer = new MongoDBContainer("mongo:4.4.4");

  @DynamicPropertySource
  static void setProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.data.mongodb.uri", mongoContainer::getReplicaSetUrl);
  }

  @Autowired
  private ReportMongoRepository repository;

  @AfterEach
  void tearDown() {
    repository.deleteAll().subscribe();
  }

  @Test
  void whenPaymentAreInSameMonthThenRetrieveThem() {
    final var startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
    final var endDate = LocalDateTime.of(2020, 1, 31, 0, 0);
    PaymentDbEntity entity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2020, 1, 10, 0, 0))
        .merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    final var saved = repository.save(entity);
    entity.setId(Objects.requireNonNull(saved.block()).getId());

    final var payments = repository.findByAccountingDateBetween(startDate, endDate);

    StepVerifier.create(payments)
        .expectNext(entity)
        .expectComplete()
        .verify();
  }

  @Test
  void whenPaymentAreNotInSameMonthThenDoNotRetrieveThem() {
    final var startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
    final var endDate = LocalDateTime.of(2020, 1, 31, 0, 0);
    PaymentDbEntity entity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2021, 5, 10, 0, 0)).merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    PaymentDbEntity outsideLowRangeEntity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2019, 12, 31, 0, 0)).merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    PaymentDbEntity outsideHighRangeEntity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2020, 2, 1, 0, 0)).merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    repository.save(entity);
    repository.save(outsideLowRangeEntity);
    repository.save(outsideHighRangeEntity);

    StepVerifier.create(repository.findAll().collectList())
        .expectNextCount(3)
        .expectComplete();

    final var payments = repository.findByAccountingDateBetween(startDate, endDate);

    StepVerifier.create(payments)
        .expectComplete()
        .verify();
  }

  @Test
  void whenPaymentAreOnTheExtremeThenRetrieveThem() {
    final var startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
    final var endDate = LocalDateTime.of(2020, 1, 31, 0, 0);
    PaymentDbEntity lowExtremeDateEntity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2020, 1, 1, 0, 0))
        .merchantName("despar")
        .description("grocery")
        .amount(-400)
        .build();
    PaymentDbEntity highExtremeDateEntity = PaymentDbEntity.builder()
        .accountingDate(LocalDateTime.of(2020, 1, 31, 0, 0))
        .merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    repository.save(highExtremeDateEntity).blockOptional()
        .ifPresent(entity -> highExtremeDateEntity.setId(entity.getId()));
    repository.save(lowExtremeDateEntity).blockOptional()
        .ifPresent(entity -> lowExtremeDateEntity.setId(entity.getId()));

    final var payments = repository.findByAccountingDateBetween(startDate, endDate);

    StepVerifier.create(payments)
        .expectNext(highExtremeDateEntity, lowExtremeDateEntity)
        .expectComplete()
        .verify();
  }
}