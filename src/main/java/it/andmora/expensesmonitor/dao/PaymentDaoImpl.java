package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.dao.persistance.PaymentMongoRepository;
import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Implementation of Dao consists of interconnections between the Dao interface and the repository.
 * It's used to decouple the interface for the use cases and the real implementation of persistance
 * layer
 */
@Component
@RequiredArgsConstructor
class PaymentDaoImpl implements PaymentDao {

  private final PaymentMongoRepository repository;
  private final PaymentDbMapper paymentMapper;

  @Override
  public Mono<Payment> savePayment(Payment payment) {
    return repository.save(paymentMapper.domainToDbEntity(payment))
        .map(paymentMapper::dbEntityToDomain);
  }

  @Override
  public Mono<Integer> getOverallBalance() {
    return repository.findAll()
        .map(this::getAmountBasedOnType)
        .reduce(0, Integer::sum);
  }

  private int getAmountBasedOnType(PaymentDbEntity payment) {
    return PaymentType.INCOME.name().equals(payment.getPaymentType()) ? payment.getAmount()
        : Math.negateExact(payment.getAmount());
  }
}
