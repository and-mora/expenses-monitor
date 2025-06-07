package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.domain.usecase.PaymentRetriever;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.backend.domain.usecase.PaymentDeleter;
import it.andmora.expensesmonitor.backend.web.dto.PagedResponse;
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
  private final PaymentRetriever paymentRetriever;

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
    return paymentRetriever.getCategories();
  }

  @Override
  public Mono<PagedResponse<PaymentDto>> getRecentPayments(int page, int size) {
    log.info("Retrieving recent payments, page: {}, size: {}", page, size);
    return paymentRetriever.getRecentPayments(page, size)
        .map(paymentMapper::entityToDto)
        .collectList()
        .map(list -> new PagedResponse<>(list, page, size));
  }
}
