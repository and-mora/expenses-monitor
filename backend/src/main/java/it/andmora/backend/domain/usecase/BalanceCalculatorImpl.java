package it.andmora.backend.domain.usecase;

import it.andmora.backend.domain.PaymentDao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class BalanceCalculatorImpl implements BalanceCalculator {

  private final PaymentDao paymentDao;

  @Override
  public Mono<Integer> getOverallBalance() {
    return paymentDao.getOverallBalance();
  }
}
