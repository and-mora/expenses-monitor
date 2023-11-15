package it.andmora.expensesmonitor.backend.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "basic-auth.username=user",
    "basic-auth.password={bcrypt}$2a$10$lnno9KSTgXgzXPidwsN0nudlqzMhd4Ls/9W122onLGQEgWUeydUmm",
    "frontend.origin=localhost:8080"
})
class PaymentControllerImplTest {

  @MockBean
  PaymentCreator paymentCreator;
  @Autowired
  PaymentController paymentController;
  LocalDateTime dateInjected = LocalDateTime.now();
  WebTestClient webTestClient;
  private static final String PUT_PAYMENT_ENDPOINT = "/payment";

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
      assertThat(payment).extracting(PaymentDto::amount).isEqualTo(1000);
      assertThat(payment).extracting(PaymentDto::accountingDate).isEqualTo(dateInjected);
    });
  }

  @Test
  @WithMockUser
  void givenAuthWhenRestInterfaceIsCalledThen200() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .mutate().build()
        .put()
        .uri(PUT_PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .expectBody(PaymentDto.class).value(payment -> {
          assertThat(payment.description()).isEqualTo("shopping");
          assertThat(payment.merchantName()).isEqualTo("H&M");
          assertThat(payment.amount()).isEqualTo(1000);
        });
  }

  @Test
  void givenNoAuthWhenRestInterfaceIsCalledThen401() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .put()
        .uri(PUT_PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isUnauthorized();
  }

  PaymentDto createPaymentDto() {
    return new PaymentDto("shopping",
        1000,
        "H&M",
        dateInjected, null);
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .build();
  }

}