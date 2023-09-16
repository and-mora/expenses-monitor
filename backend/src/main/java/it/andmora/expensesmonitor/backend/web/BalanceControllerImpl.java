package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.domain.usecase.BalanceCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * The controller in this layer is the interface between the use cases and any outside interfaces
 * Here happens all the data format conversion from and to whatever is required by the use cases
 */
@RestController
@Slf4j
@RequiredArgsConstructor
class BalanceControllerImpl implements BalanceController {

  private final BalanceCalculator balanceCalculator;

  @Override
  public Mono<Integer> getOverallBalance() {
    log.info("[BALANCE] Getting overall balance...");
    return balanceCalculator.getOverallBalance();
  }
}
