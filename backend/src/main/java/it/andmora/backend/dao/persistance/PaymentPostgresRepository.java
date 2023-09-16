package it.andmora.backend.dao.persistance;

import it.andmora.backend.dao.dbmodel.PaymentDbEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

/**
 * The persistance layer implements the repository or anything needed to persist the domain objects
 */
public interface PaymentPostgresRepository extends ReactiveCrudRepository<PaymentDbEntity, Integer> {

}
