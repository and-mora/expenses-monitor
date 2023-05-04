package it.andmora.expensesmonitor.domain.usecase;


import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.model.PeriodicReport;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class PeriodicReportServiceImpl implements PeriodicReportService {

  private final ReportDao reportDao;

  @Override
  public Mono<PeriodicReport> getPeriodicReport(String aggregationField, LocalDateTime startDate,
      LocalDateTime endDate) {
    // build the report
    PeriodicReport report = PeriodicReport.builder().build();
    reportDao.getReport(aggregationField, startDate, endDate)
        .doOnNext(payment -> report.addVoice(payment.getDescription(), payment.getAmount()))
        .then();

    return Mono.just(report);
  }
}
