package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping("api/payment")
public interface PaymentController {

  @PutMapping("")
  Mono<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto);
}
