package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import reactor.core.publisher.Mono;

public interface MonthlyReportService {

  Mono<MonthlyReport> getMonthlyReport(int month, int year);

}
