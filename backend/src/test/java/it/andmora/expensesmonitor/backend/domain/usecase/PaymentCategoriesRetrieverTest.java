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
class PaymentCategoriesRetrieverTest {

  @Mock
  PaymentDao paymentDao;
  private PaymentCategoriesRetriever retriever;

  @BeforeEach
  void setUp() {
    retriever = new PaymentCategoriesRetriever(paymentDao);
  }

  @Test
  void whenGetCategoriesThenReturnFlux() {
    Mockito.when(paymentDao.getCategories()).thenReturn(Flux.just("foo", "bar", "pippo"));

    var categories = retriever.getCategories();

    StepVerifier
        .create(categories)
        .expectNext("foo", "bar", "pippo")
        .expectComplete()
        .verify();
  }
}