package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.model.PeriodicReport;
import java.time.LocalDateTime;
import reactor.core.publisher.Mono;

public interface PeriodicReportService {

  Mono<PeriodicReport> getPeriodicReport(String aggregationField, LocalDateTime startDate, LocalDateTime endDate);

}
