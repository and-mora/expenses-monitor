package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
class PaymentCreatorImpl implements PaymentCreator {

  private final PaymentDao paymentDao;

  @Override
  public Mono<Payment> createPayment(Payment payment) {
    // business validation goes here

    return paymentDao.savePayment(payment);
  }
}
