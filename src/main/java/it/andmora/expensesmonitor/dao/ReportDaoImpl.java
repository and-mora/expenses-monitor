package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.dao.persistance.ReportMongoRepository;
import it.andmora.expensesmonitor.domain.ReportDao;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
@RequiredArgsConstructor
class ReportDaoImpl implements ReportDao {

  private final ReportMongoRepository reportMongoRepository;

  @Override
  public Flux<PaymentDbEntity> getReport(String aggregationField, LocalDateTime startDate,
      LocalDateTime endDate) {
    return reportMongoRepository.findByAccountingDateGreaterThanAndAccountingDateLessThan(startDate, endDate);
  }
}
