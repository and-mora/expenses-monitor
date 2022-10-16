package it.andmora.expensesmonitor.controller;

import it.andmora.expensesmonitor.controller.dto.PaymentDto;
import it.andmora.expensesmonitor.controller.mapper.PaymentMapper;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import lombok.RequiredArgsConstructor;

/**
 * The controller in this layer is the interface between the use cases and any outside interfaces
 * Here happens all the data format conversion from and to whatever is required by the use cases
 */
@RequiredArgsConstructor
public class PaymentControllerImpl implements PaymentController {

  private final PaymentCreator paymentCreator;
  private final PaymentMapper paymentMapper;

  @Override
  public PaymentDto createPayment(PaymentDto paymentDto) {
    return paymentMapper.entityToDto(paymentCreator.createPayment(paymentMapper.dtoToEntity(paymentDto)));
  }
}
