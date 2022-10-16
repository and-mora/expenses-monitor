package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;

/**
 * Implementation of Dao consists of interconnections between the Dao interface and the repository.
 * It's used to decouple the interface for the use cases and the real implementation of persistance
 * layer
 */
class PaymentDaoImplSample implements PaymentDao {

  // custom repository interface

  @Override
  public Payment savePayment(Payment payment) {
    return null;
  }
}
