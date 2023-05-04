package it.andmora.expensesmonitor.dao.persistance;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import java.time.LocalDateTime;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface ReportMongoRepository extends ReactiveMongoRepository<PaymentDbEntity, String> {

  Flux<PaymentDbEntity> findByAccountingDateGreaterThanAndAccountingDateLessThan(
      LocalDateTime startDate, LocalDateTime endDate);
}
