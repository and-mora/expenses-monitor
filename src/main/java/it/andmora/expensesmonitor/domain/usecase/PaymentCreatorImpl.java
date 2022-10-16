package it.andmora.expensesmonitor.domain.usecase;

import it.andmora.expensesmonitor.dao.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class PaymentCreatorImpl implements PaymentCreator {

  private final PaymentDao paymentDao;

  @Override
  public Payment createPayment(Payment payment) {
    // business validation goes here

    return paymentDao.savePayment(payment);
  }
}
