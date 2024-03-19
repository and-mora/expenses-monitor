package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class PaymentCategoriesRetriever {

  private final PaymentDao paymentDao;

  public Flux<String> getCategories() {
    return paymentDao.getCategories();
  }

}
