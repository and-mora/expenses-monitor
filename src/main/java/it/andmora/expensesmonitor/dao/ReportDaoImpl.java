package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.dao.mapper.PaymentDbMapper;
import it.andmora.expensesmonitor.dao.persistance.ReportMongoRepository;
import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.model.Payment;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
@RequiredArgsConstructor
class ReportDaoImpl implements ReportDao {

  private final ReportMongoRepository reportMongoRepository;
  private final PaymentDbMapper paymentMapper;

  @Override
  public Flux<Payment> getReport(LocalDateTime startDate, LocalDateTime endDate) {
    return reportMongoRepository.findByAccountingDateBetween(startDate,
        endDate)
        .map(paymentMapper::dbEntityToDomain);
  }
}
