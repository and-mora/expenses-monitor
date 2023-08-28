package it.andmora.expensesmonitor.domain.usecase;

import reactor.core.publisher.Mono;

/**
 * use case to calculate the account balance
 */
public interface BalanceCalculator {

  Mono<Integer> getOverallBalance();
}
