package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class PaymentRetrieverTest {

  @Mock
  PaymentDao paymentDao;
  private PaymentRetriever retriever;

  @BeforeEach
  void setUp() {
    retriever = new PaymentRetriever(paymentDao);
  }

  @Test
  void whenGetCategoriesThenReturnFlux() {
    Mockito.when(paymentDao.getCategories(null)).thenReturn(Flux.just("foo", "bar", "pippo"));

    var categories = retriever.getCategories(null);

    StepVerifier
        .create(categories)
        .expectNext("foo", "bar", "pippo")
        .expectComplete()
        .verify();
  }
}