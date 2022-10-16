package it.andmora.expensesmonitor.controller;

import it.andmora.expensesmonitor.controller.dto.PaymentDto;

public interface PaymentController {

  PaymentDto createPayment(PaymentDto paymentDto);

}
