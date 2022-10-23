package it.andmora.expensesmonitor.web;

import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.web.dto.PaymentDto;
import it.andmora.expensesmonitor.web.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;

/**
 * The controller in this layer is the interface between the use cases and any outside interfaces
 * Here happens all the data format conversion from and to whatever is required by the use cases
 */
@RestController
@Slf4j
@RequiredArgsConstructor
class PaymentControllerImpl implements PaymentController {

  private final PaymentCreator paymentCreator;
  private final PaymentMapper paymentMapper;

  @Override
  public PaymentDto createPayment(PaymentDto paymentDto) {
    log.info("Creation of a new payment...");
    return paymentMapper.entityToDto(
        paymentCreator.createPayment(paymentMapper.dtoToEntity(paymentDto)));
  }
}
