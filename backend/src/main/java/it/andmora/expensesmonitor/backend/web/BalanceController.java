package it.andmora.expensesmonitor.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping("api/balance")
public interface BalanceController {

  @GetMapping
  Mono<Integer> getOverallBalance();
}
