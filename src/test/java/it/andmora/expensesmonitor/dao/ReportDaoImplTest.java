package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapperImpl;
import it.andmora.expensesmonitor.dao.persistance.ReportMongoRepository;
import it.andmora.expensesmonitor.domain.ReportDao;
import java.time.LocalDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

class ReportDaoImplTest {

  @Mock
  private ReportMongoRepository repository;
  private final PaymentDbMapper mapper = new PaymentDbMapperImpl();
  private ReportDao reportDao;

  private AutoCloseable autoCloseable;

  @BeforeEach
  void setUp() {
    autoCloseable = MockitoAnnotations.openMocks(this);
    reportDao = new ReportDaoImpl(repository, mapper);
  }

  @AfterEach
  void tearDown() throws Exception {
    autoCloseable.close();
  }

  @Test
  void whenGetReportThenMapCorrectly() {

    final var startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
    final var endDate = LocalDateTime.of(2020, 1, 31, 0, 0);
    PaymentDbEntity entity = PaymentDbEntity.builder()
        .accountingDate(startDate)
        .merchantName("coop")
        .description("grocery")
        .amount(-200)
        .build();
    Mockito.when(repository.findByAccountingDateBetween(startDate, endDate)).thenReturn(Flux.just(entity));

    StepVerifier
        .create(reportDao.getReport(startDate, endDate))
        .expectNext(mapper.dbEntityToDomain(entity))
        .expectComplete()
        .verify();
  }
}