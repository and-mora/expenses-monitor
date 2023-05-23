package it.andmora.expensesmonitor.domain.usecase;


import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import it.andmora.expensesmonitor.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class MonthlyReportServiceImpl implements MonthlyReportService {

  private final ReportDao reportDao;

  @Override
  public Mono<MonthlyReport> getMonthlyReport(int month, int year) {
    final var startDate = DateUtils.getStartOfMonthDate(month, year);
    final var endDate = DateUtils.getEndOfMonthDate(month, year);

    // build the report
    var report = MonthlyReport.newInstance(startDate, endDate);

    return reportDao.getReport(startDate, endDate)
        .doOnNext(payment -> report.addVoice(payment.getDescription(), payment.getAmount()))
        .then(Mono.just(report));
  }
}
