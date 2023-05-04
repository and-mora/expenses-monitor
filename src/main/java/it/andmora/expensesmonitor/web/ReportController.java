package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.domain.model.PeriodicReport;
import java.time.LocalDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;


public interface ReportController {

  @GetMapping("report")
  Mono<PeriodicReport> getReport(@RequestParam String field, @RequestParam LocalDateTime startDate,
      @RequestParam LocalDateTime endDate);
}
