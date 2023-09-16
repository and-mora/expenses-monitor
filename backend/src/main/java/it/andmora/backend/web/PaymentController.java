package it.andmora.backend.web;

import it.andmora.backend.web.dto.PaymentDto;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping("payment")
public interface PaymentController {

  @PutMapping("")
  Mono<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto);
}
