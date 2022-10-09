package it.andmora.expensesmonitor.controller;

import it.andmora.expensesmonitor.domain.dto.PaymentDto;

public interface PaymentController {

  PaymentDto createPayment(PaymentDto paymentDto);

}
