package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCategoriesRetriever;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentDeleter;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import it.andmora.expensesmonitor.backend.web.mapper.PaymentControllerMapper;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * The controller in this layer is the interface between the use cases and any outside interfaces
 * Here happens all the data format conversion from and to whatever is required by the use cases
 */
@RestController
@Slf4j
@RequiredArgsConstructor
class PaymentControllerImpl implements PaymentController {

  private final PaymentCreator paymentCreator;
  private final PaymentControllerMapper paymentMapper;
  private final PaymentDeleter paymentDeleter;
  private final PaymentCategoriesRetriever paymentCategoriesRetriever;

  @Override
  public Mono<PaymentDto> createPayment(PaymentDto paymentDto) {
    log.info("Creation of a new payment...");
    return paymentCreator.createPayment(paymentMapper.dtoToEntity(paymentDto))
        .map(paymentMapper::entityToDto);
  }

  @Override
  public Mono<Void> deletePayment(UUID id) {
    log.info("Deletion of payment with id: {}", id);
    return paymentDeleter.deletePayment(id);
  }

  @Override
  public Flux<String> getCategories() {
    log.info("Retrieving categories...");
    return paymentCategoriesRetriever.getCategories();
  }
}
