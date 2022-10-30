package it.andmora.expensesmonitor.dao.persistance;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

/**
 * The persistance layer implements the repository or anything needed to persist the domain objects
 */
public interface PaymentMongoRepository extends ReactiveMongoRepository<PaymentDbEntity, String> {

  Flux<PaymentDbEntity> findByPaymentType(String paymentType);
}
