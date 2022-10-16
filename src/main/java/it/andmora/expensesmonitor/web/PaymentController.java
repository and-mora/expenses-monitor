package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.web.dto.PaymentDto;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("payment")
public interface PaymentController {

  @PutMapping("")
  PaymentDto createPayment(@RequestBody PaymentDto paymentDto);

}
