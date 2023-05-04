package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.domain.model.MonthlyReport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;


public interface ReportController {

  @GetMapping("monthlyReport")
  Mono<MonthlyReport> getMonthlyReport(@RequestParam int month, @RequestParam int year);
}
