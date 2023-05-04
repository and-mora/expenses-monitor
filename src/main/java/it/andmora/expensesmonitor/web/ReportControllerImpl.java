package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.domain.model.PeriodicReport;
import it.andmora.expensesmonitor.domain.usecase.PeriodicReportService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@RequiredArgsConstructor
public class ReportControllerImpl implements ReportController {

  private final PeriodicReportService periodicReportService;

  @Override
  public Mono<PeriodicReport> getReport(String field, LocalDateTime startDate,
      LocalDateTime endDate) {
    return periodicReportService.getPeriodicReport(field, startDate, endDate);
  }
}
