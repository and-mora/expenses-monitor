package it.andmora.expensesmonitor.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.web.dto.PaymentDto;
import it.andmora.expensesmonitor.web.mapper.PaymentMapper;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import reactor.core.publisher.Mono;

class PaymentControllerImplTest {

  PaymentMapper paymentMapper = Mappers.getMapper(PaymentMapper.class);
  @Mock
  PaymentCreator paymentCreator;
  PaymentController paymentController;
  OffsetDateTime dateInjected = OffsetDateTime.now();
  AutoCloseable closeable;
//  @Autowired
//  MockMvc mockMvc;
//
//  private final String BASE_URI = "http://localhost:8080";
//  private static final String PUT_PAYMENT_ENDPOINT = "/payment";

  @BeforeEach
  void setup() {
    closeable = MockitoAnnotations.openMocks(this);

    paymentController = new PaymentControllerImpl(paymentCreator, paymentMapper);
  }

  @AfterEach
  void cleanup() throws Exception {
    closeable.close();
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

//  @Test
//  void whenRestInterfaceIsCalledThen200() throws Exception {
//    Mockito.when(paymentCreator.createPayment(any())).thenReturn(createDefaultPayment());
//    PaymentDto paymentDto = createPaymentDto();
//    ObjectMapper mapper = new ObjectMapper();
//    String paymentDtoAsJson = mapper.writeValueAsString(paymentDto);
//
//    mockMvc.perform(MockMvcRequestBuilders
//            .put(BASE_URI + PUT_PAYMENT_ENDPOINT)
//            .contentType(MediaType.APPLICATION_JSON)
//            .content(paymentDtoAsJson))
//        .andExpectAll(status().isOk(),
//            content().contentType(MediaType.APPLICATION_JSON_VALUE),
//            jsonPath("$.description").value("shopping"),
//            jsonPath("$.merchantName").value("H&M"),
//            jsonPath("$.amount").value(100)
//        );
//  }

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