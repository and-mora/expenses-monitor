package it.andmora.expensesmonitor.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.web.dto.PaymentDto;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentControllerImplTest {

  @MockBean
  PaymentCreator paymentCreator;
  @Autowired
  PaymentController paymentController;
  LocalDateTime dateInjected = LocalDateTime.now();
  @Autowired
  WebTestClient webTestClient;
  private static final String PUT_PAYMENT_ENDPOINT = "/payment";

  @BeforeEach
  void setup() {
  }

  @Test
  void whenCreatePaymentThenReturnExpectedFields() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    Mono<PaymentDto> paymentResponse = paymentController.createPayment(paymentDto);

    paymentResponse.subscribe(payment -> {
      assertThat(payment).extracting("description").isEqualTo("shopping");
      assertThat(payment).extracting("merchantName").isEqualTo("H&M");
      assertThat(payment).extracting("amount").isEqualTo(1000);
      assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
      assertThat(payment).extracting("isIncomeVoice").isEqualTo(false);
    });
  }

  @Test
  void whenRestInterfaceIsCalledThen200() {
    Mockito.when(paymentCreator.createPayment(any())).thenReturn(Mono.just(createDefaultPayment()));
    PaymentDto paymentDto = createPaymentDto();

    webTestClient
        .put()
        .uri(PUT_PAYMENT_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(paymentDto)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
//        .expectBody()
//        .jsonPath("$.description").isEqualTo("shopping")
//        .jsonPath("$.merchantName").isEqualTo("H&M")
//        .jsonPath("$.amount").isEqualTo(1000);
        .expectBody(PaymentDto.class).value(payment -> {
          assertThat(payment).extracting("description").isEqualTo("shopping");
          assertThat(payment).extracting("merchantName").isEqualTo("H&M");
          assertThat(payment).extracting("amount").isEqualTo(1000);
//          assertThat(payment).extracting("accountingDate").isEqualTo(dateInjected);
          assertThat(payment).extracting("isIncomeVoice").isEqualTo(false);
        });
  }

  PaymentDto createPaymentDto() {
    return PaymentDto.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .isIncomeVoice(false).build();
  }

  Payment createDefaultPayment() {
    return Payment.builder()
        .description("shopping")
        .merchantName("H&M")
        .amount(1000)
        .accountingDate(dateInjected)
        .paymentType(PaymentType.OUTCOME).build();
  }

}