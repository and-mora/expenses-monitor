package it.andmora.expensesmonitor.domain.usecase;

import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import it.andmora.expensesmonitor.domain.model.Payment;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

class MonthlyReportServiceImplTest {

  @Mock
  ReportDao reportDao;
  MonthlyReportService monthlyReportService;
  AutoCloseable autoCloseable;


  @BeforeEach
  void setUp() {
    autoCloseable = MockitoAnnotations.openMocks(this);

    monthlyReportService = new MonthlyReportServiceImpl(reportDao);
  }

  @AfterEach
  void tearDown() throws Exception {
    autoCloseable.close();
  }

  @Test
  void givenNoPaymentsThenReturnsEmptyReport() {

    Mockito.when(reportDao.getReport(any(), any())).thenReturn(Flux.empty());

    var report = monthlyReportService.getMonthlyReport(1, 2020);

    StepVerifier
        .create(report)
        .expectNext(MonthlyReport.builder().build())
        .expectComplete()
        .verify();
  }

  @Test
  void givenPaymentsThenReturnsAggregationReport() {

    Mockito.when(reportDao.getReport(any(), any())).thenReturn(getPayments());
    Map<String, Integer> reportMap = new HashMap<>();
    reportMap.put("spesa", -600);

    var report = monthlyReportService.getMonthlyReport(1, 2020);

    StepVerifier
        .create(report)
        .expectNext(MonthlyReport.builder().dataMap(reportMap).build())
        .expectComplete()
        .verify();
  }

  private Flux<Payment> getPayments() {
    return Flux.just(
        Payment.builder().description("spesa").amount(-100).merchantName("coop").build(),
        Payment.builder().description("spesa").amount(-500).merchantName("despar").build());
  }
}