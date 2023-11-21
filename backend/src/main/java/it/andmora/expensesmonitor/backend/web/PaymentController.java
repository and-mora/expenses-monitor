package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping("api/payment")
public interface PaymentController {

  @PutMapping("")
  Mono<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto);

  @DeleteMapping("")
  Mono<Void> deletePayment(@PathVariable(name = "id") Integer id);
}
