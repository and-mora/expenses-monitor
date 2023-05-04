package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import it.andmora.expensesmonitor.domain.usecase.MonthlyReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@RequiredArgsConstructor
public class ReportControllerImpl implements ReportController {

  private final MonthlyReportService monthlyReportService;

  @Override
  public Mono<MonthlyReport> getMonthlyReport(int month, int year) {
    return monthlyReportService.getMonthlyReport(month, year);
  }
}
