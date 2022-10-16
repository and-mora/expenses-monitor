package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
class PaymentCreatorImpl implements PaymentCreator {

  private final PaymentDao paymentDao;

  @Override
  public Payment createPayment(Payment payment) {
    // business validation goes here

    return paymentDao.savePayment(payment);
  }
}
