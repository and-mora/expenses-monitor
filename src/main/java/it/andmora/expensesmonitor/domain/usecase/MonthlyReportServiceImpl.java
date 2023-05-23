package it.andmora.expensesmonitor.domain.usecase;


import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class MonthlyReportServiceImpl implements MonthlyReportService {

  private final ReportDao reportDao;

  @Override
  public Mono<MonthlyReport> getMonthlyReport(int month, int year) {
    final var startDate = LocalDateTime.of(year, month, 1, 0, 0);
    final var endDate = LocalDateTime.from(startDate).plusMonths(1).minusNanos(1);

    // build the report
    var report = MonthlyReport.newInstance(startDate, endDate);

    return reportDao.getReport(startDate, endDate)
        .doOnNext(payment -> report.addVoice(payment.getDescription(), payment.getAmount()))
        .then(Mono.just(report));
  }
}
