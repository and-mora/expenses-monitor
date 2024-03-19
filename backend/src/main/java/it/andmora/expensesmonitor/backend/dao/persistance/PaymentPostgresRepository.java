package it.andmora.expensesmonitor.backend.dao.persistance;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

/**
 * The persistance layer implements the repository or anything needed to persist the domain objects
 */
public interface PaymentPostgresRepository extends ReactiveCrudRepository<PaymentDbEntity, Integer> {

  @Query("SELECT DISTINCT p.category FROM payments p")
  Flux<String> getCategories();
}
