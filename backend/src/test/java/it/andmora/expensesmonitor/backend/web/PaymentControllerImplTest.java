package it.andmora.expensesmonitor.backend.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import it.andmora.expensesmonitor.backend.domain.errors.WalletNotFoundException;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.model.Tag;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentDeleter;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentRetriever;
import it.andmora.expensesmonitor.backend.web.dto.ErrorDto;
import it.andmora.expensesmonitor.backend.web.dto.PagedResponse;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import it.andmora.expensesmonitor.backend.web.dto.TagDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.assertj.core.api.InstanceOfAssertFactories;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentControllerImplTest {

  @MockitoBean
  PaymentCreator paymentCreator;
  @MockitoBean
  PaymentDeleter paymentDeleter;
  @MockitoBean
  PaymentRetriever paymentRetriever;
  @Autowired
  PaymentController paymentController;
  LocalDateTime dateInjected = LocalDateTime.now();
  WebTestClient webTestClient;
  private static final String PAYMENT_ENDPOINT = "/api/payments";
  private static final String DELETE_PAYMENT_ENDPOINT = "/api/payments/{id}";
  private static final String GET_CATEGORIES_ENDPOINT = "/api/payments/categories";

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
      assertThat(payment).extracting(PaymentDto::wallet).isEqualTo("wallet");
      assertThat(payment).extracting(PaymentDto::tags).asInstanceOf(InstanceOfAssertFactories.LIST)
          .hasSize(2);
    });
  }

  @Test
  void whenCreatePaymentWithoutTagsThenReturnExpectedFields() {
    Mockito.when(paymentCreator.createPayment(any()))
        .thenReturn(Mono.just(createDefaultPaymentWithoutTags()));
    PaymentDto paymentDto = createPaymentDtoWithoutTags();

    Mono<PaymentDto> paymentResponse = paymentController.createPayment(paymentDto);

    paymentResponse.subscribe(payment -> {
      assertThat(payment).extracting(PaymentDto::description).isEqualTo("shopping");
      assertThat(payment).extracting(PaymentDto::merchantName).isEqualTo("H&M");
      assertThat(payment).extracting(PaymentDto::amountInCents).isEqualTo(1000);
      assertThat(payment).extracting(PaymentDto::accountingDate).isEqualTo(dateInjected);
      assertThat(payment).extracting(PaymentDto::wallet).isEqualTo("wallet");
    });
  }

  @Test
  void whenDeletePaymentThenReturnsOk() {
    Mockito.when(paymentDeleter.deletePayment(any())).thenReturn(Mono.empty());

    Mono<Void> paymentResponse = paymentController.deletePayment(UUID.randomUUID());

    Mockito.verify(paymentDeleter).deletePayment(any());
    StepVerifier
        .create(paymentResponse)
        .expectComplete()
        .verify();
  }

  @Test
  void givenAuthWhenRestInterfaceIsCalledThen200() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .mutateWith(mockJwt())
        .post()
        .uri(PAYMENT_ENDPOINT)
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
  void givenAuthWhenDeleteEndpointIsCalledThen200() {
    Mockito.when(paymentDeleter.deletePayment(any())).thenReturn(Mono.empty());
    var uuid = UUID.randomUUID();
    webTestClient
        .mutateWith(mockJwt())
        .delete()
        .uri(uriBuilder -> uriBuilder
            .path(DELETE_PAYMENT_ENDPOINT)
            .build(uuid))
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isOk();
    Mockito.verify(paymentDeleter).deletePayment(uuid);
  }

  @Test
  void whenGetCategoriesIsCalledThen200() {
    Mockito.when(paymentRetriever.getCategories()).thenReturn(Flux.just("foo", "bar"));

    webTestClient
        .mutateWith(mockJwt())
        .get()
        .uri(uriBuilder -> uriBuilder
            .path(GET_CATEGORIES_ENDPOINT)
            .build())
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType("application/json;charset=UTF-8")
        .expectBody(String.class).value(value -> assertThat(value).contains("foobar"));
    Mockito.verify(paymentRetriever).getCategories();
  }

  @Test
  void givenNoAuthWhenRestInterfaceIsCalledThen401() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .put()
        .uri(PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isUnauthorized();
  }

  @Test
  @WithMockUser
  void whenCreatePaymentAndWalletNotFoundThenReturnNotFound() {
    Mockito.when(paymentCreator.createPayment(any())).thenThrow(new WalletNotFoundException(
        Wallet.builder().name("wallet").build()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .mutate().build()
        .post()
        .uri(PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().is4xxClientError()
        .expectBody(ErrorDto.class).isEqualTo(ErrorDto.builder()
            .code("WALLET_NOT_FOUND")
            .detail("Wallet null does not exist. Please create it first.")
            .build());
  }

  @Test
  @WithMockUser
  void getRecentPayments_returnsPagedResponse() {
    when(paymentRetriever.getRecentPayments(0, 2)).thenReturn(
        Flux.just(createDefaultPayment(), createDefaultPayment()));

    webTestClient.get().uri(PAYMENT_ENDPOINT + "?page=0&size=2")
        .exchange()
        .expectStatus().isOk()
        .expectBody()
        .jsonPath("$.content").value(content -> {
          assertThat(content).asInstanceOf(InstanceOfAssertFactories.LIST)
              .hasSize(2);
        })
        .jsonPath("$.page").isEqualTo(0)
        .jsonPath("$.size").isEqualTo(2);
  }

  @Test
  @WithMockUser
  void getRecentPayments_withNoParams_thenUseDefaultValues() {
    when(paymentRetriever.getRecentPayments(0, 10)).thenReturn(
        Flux.just(createDefaultPayment(), createDefaultPayment()));

    webTestClient.get().uri(PAYMENT_ENDPOINT)
        .exchange()
        .expectStatus().isOk()
        .expectBody()
        .jsonPath("$.content").value(content -> {
          assertThat(content).asInstanceOf(InstanceOfAssertFactories.LIST)
              .hasSize(2);
        })
        .jsonPath("$.page").isEqualTo(0)
        .jsonPath("$.size").isEqualTo(10);
  }

  PaymentDto createPaymentDto() {
    return new PaymentDto(UUID.randomUUID(),
        "shopping",
        1000,
        "H&M",
        dateInjected,
        null,
        "wallet",
        List.of(new TagDto(UUID.randomUUID(), "key", "value"),
            new TagDto(UUID.randomUUID(), "key", "value")));
  }

  PaymentDto createPaymentDtoWithoutTags() {
    return new PaymentDto(UUID.randomUUID(),
        "shopping",
        1000,
        "H&M",
        dateInjected,
        null,
        "wallet",
        null);
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().id(UUID.randomUUID()).name("wallet").build())
        .tags(List.of(Tag.builder().id(UUID.randomUUID()).key("key").value("value").build(),
            Tag.builder().id(UUID.randomUUID()).key("chiave").value("valore").build()))
        .build();
  }

  Payment createDefaultPaymentWithoutTags() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amountInCents(1000)
        .accountingDate(dateInjected)
        .wallet(Wallet.builder().id(UUID.randomUUID()).name("wallet").build())
        .build();
  }

}