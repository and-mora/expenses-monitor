package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.web.dto.PaymentDto;

public interface PaymentController {

  PaymentDto createPayment(PaymentDto paymentDto);

}
