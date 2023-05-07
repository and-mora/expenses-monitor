package it.andmora.expensesmonitor.dao.persistance;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import java.time.LocalDateTime;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface ReportMongoRepository extends ReactiveMongoRepository<PaymentDbEntity, String> {

  // between works as exclusive, need to explicit query for inclusive start/end
  @Query("{'accountingDate' : { $gte: ?0, $lte: ?1 } }")
  Flux<PaymentDbEntity> findByAccountingDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
