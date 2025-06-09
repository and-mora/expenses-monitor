package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class PaymentRetriever {

  private final PaymentDao paymentDao;

  public Flux<String> getCategories() {
    return paymentDao.getCategories();
  }

  public Flux<Payment> getRecentPayments(int page, int size) {
    return paymentDao.getRecentPayments(page, size);
  }
}
