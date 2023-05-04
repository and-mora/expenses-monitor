package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.domain.model.Payment;
import java.time.LocalDateTime;
import reactor.core.publisher.Flux;

public interface ReportDao {

  Flux<Payment> getReport(LocalDateTime startDate, LocalDateTime endDate);

}
