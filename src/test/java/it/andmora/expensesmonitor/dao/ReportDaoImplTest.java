package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapperImpl;
import it.andmora.expensesmonitor.dao.persistance.ReportMongoRepository;
import it.andmora.expensesmonitor.domain.ReportDao;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

@Testcontainers
@DataMongoTest
class ReportDaoImplTest {
  
  @Container
  public static final MongoDBContainer mongoContainer = new MongoDBContainer("mongo:4.4.4");

  @Autowired 
  private ReportMongoRepository repository;
  private final PaymentDbMapper mapper = new PaymentDbMapperImpl();
  private ReportDao reportDao;

  @BeforeEach
  void setUp() {

    reportDao = new ReportDaoImpl(repository, mapper);
  }

  @Test
  void whenPaymentAreInSameMonthThenRetrieveThem() {
    final var startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
    final var endDate = LocalDateTime.of(2020, 2, 1, 0, 0);
    PaymentDbEntity entity = PaymentDbEntity.builder()
        .accountingDate(startDate)
        .merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    repository.save(entity);

    StepVerifier
        .create(reportDao.getReport(startDate, endDate))
        .expectNext(mapper.dbEntityToDomain(entity))
        .expectComplete()
        .verify();
  }
}