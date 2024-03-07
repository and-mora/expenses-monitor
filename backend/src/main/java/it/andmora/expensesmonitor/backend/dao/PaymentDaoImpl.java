package it.andmora.expensesmonitor.backend.dao;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.PaymentPostgresRepository;
import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
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

  private final PaymentPostgresRepository repository;
  private final PaymentDbMapper paymentMapper;

  @Override
  public Mono<Payment> savePayment(Payment payment) {
    return repository.save(paymentMapper.domainToDbEntity(payment))
        .map(paymentMapper::dbEntityToDomain);
  }

  @Override
  public Mono<Integer> getOverallBalance() {
    return repository.findAll()
        .map(PaymentDbEntity::getAmountInCents)
        .reduce(0, Integer::sum);
  }

  @Override
  public Mono<Void> deletePayment(Integer id) {
    return repository.deleteById(id);
  }

}
