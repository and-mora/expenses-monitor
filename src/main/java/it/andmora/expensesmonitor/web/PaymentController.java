package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.web.dto.PaymentDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping("payment")
public interface PaymentController {

  @PutMapping("")
  Mono<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto);

  @GetMapping
  Mono<Integer> getOverallBalance();
}
