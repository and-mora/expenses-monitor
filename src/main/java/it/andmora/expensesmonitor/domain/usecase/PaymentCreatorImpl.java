package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.model.Payment;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class PaymentCreatorImpl implements PaymentCreator {

  private final PaymentDao paymentDao;

  @Override
  public Mono<Payment> createPayment(Payment payment) {
    // business validation goes here

    return paymentDao.savePayment(payment);
  }
}
