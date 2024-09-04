package it.andmora.expensesmonitor.backend.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCategoriesRetriever;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentDeleter;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentControllerImplTest {

  @MockBean
  PaymentCreator paymentCreator;
  @MockBean
  PaymentDeleter paymentDeleter;
  @MockBean
  PaymentCategoriesRetriever categoriesRetriever;
  @Autowired
  PaymentController paymentController;
  LocalDateTime dateInjected = LocalDateTime.now();
  WebTestClient webTestClient;
  private static final String POST_PAYMENT_ENDPOINT = "/api/payment";
  private static final String DELETE_PAYMENT_ENDPOINT = "/api/payment/{id}";
  private static final String GET_CATEGORIES_ENDPOINT = "/api/payment/categories";

  @Autowired
  ApplicationContext context;

  @BeforeEach
  public void setup() {
    this.webTestClient = WebTestClient
        .bindToApplicationContext(this.context)
        // add Spring Security test Support
        .apply(springSecurity())
        .configureClient()
        .build();
  }

  @Test
  void whenCreatePaymentThenReturnExpectedFields() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    Mono<PaymentDto> paymentResponse = paymentController.createPayment(paymentDto);

    paymentResponse.subscribe(payment -> {
      assertThat(payment).extracting(PaymentDto::description).isEqualTo("shopping");
      assertThat(payment).extracting(PaymentDto::merchantName).isEqualTo("H&M");
      assertThat(payment).extracting(PaymentDto::amountInCents).isEqualTo(1000);
      assertThat(payment).extracting(PaymentDto::accountingDate).isEqualTo(dateInjected);
    });
  }

  @Test
  void whenDeletePaymentThenReturnsOk() {
    Mockito.when(paymentDeleter.deletePayment(any())).thenReturn(Mono.empty());

    Mono<Void> paymentResponse = paymentController.deletePayment(0);

    Mockito.verify(paymentDeleter).deletePayment(any());
    StepVerifier
        .create(paymentResponse)
        .expectComplete()
        .verify();
  }

  @Test
  @WithMockUser
  void givenAuthWhenRestInterfaceIsCalledThen200() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .mutate().build()
        .post()
        .uri(POST_PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .expectBody(PaymentDto.class).value(payment -> {
          assertThat(payment.description()).isEqualTo("shopping");
          assertThat(payment.merchantName()).isEqualTo("H&M");
          assertThat(payment.amountInCents()).isEqualTo(1000);
        });
  }

  @Test
  @WithMockUser
  void givenAuthWhenDeleteEndpointIsCalledThen200() {
    Mockito.when(paymentDeleter.deletePayment(any())).thenReturn(Mono.empty());

    webTestClient
        .mutate().build()
        .delete()
        .uri(uriBuilder -> uriBuilder
            .path(DELETE_PAYMENT_ENDPOINT)
            .build(0))
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isOk();
    Mockito.verify(paymentDeleter).deletePayment(0);
  }

  @Test
  @WithMockUser
  void whenGetCategoriesIsCalledThen200() {
    Mockito.when(categoriesRetriever.getCategories()).thenReturn(Flux.just("foo", "bar"));

    webTestClient
        .mutate().build()
        .get()
        .uri(uriBuilder -> uriBuilder
            .path(GET_CATEGORIES_ENDPOINT)
            .build())
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType("application/json;charset=UTF-8")
        .expectBody(String.class).value(value -> {
          assertThat(value).contains("foobar");
        });
    Mockito.verify(categoriesRetriever).getCategories();
  }

  @Test
  void givenNoAuthWhenRestInterfaceIsCalledThen401() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .put()
        .uri(POST_PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isUnauthorized();
  }

  PaymentDto createPaymentDto() {
    return new PaymentDto(UUID.randomUUID(),
        "shopping",
        1000,
        "H&M",
        dateInjected, null);
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .build();
  }

}