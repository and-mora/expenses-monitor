package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import java.time.LocalDateTime;
import reactor.core.publisher.Flux;

public interface ReportDao {

  Flux<PaymentDbEntity> getReport(String aggregationField, LocalDateTime startDate,
      LocalDateTime endDate);

}
