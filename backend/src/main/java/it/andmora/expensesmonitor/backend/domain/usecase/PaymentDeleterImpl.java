package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class PaymentDeleterImpl implements PaymentDeleter {

  private final PaymentDao paymentDao;

  @Override
  public Mono<Void> deletePayment(Integer id) {
    return paymentDao.deletePayment(id);
  }
}
