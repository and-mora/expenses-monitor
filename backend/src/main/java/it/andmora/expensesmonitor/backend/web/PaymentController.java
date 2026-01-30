package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.web.dto.PagedResponse;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequestMapping("api/payments")
public interface PaymentController {

  @PostMapping("")
  Mono<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto);

  @DeleteMapping("/{id}")
  Mono<Void> deletePayment(@PathVariable(name = "id") UUID id);

  @GetMapping("/categories")
  Mono<List<String>> getCategories(@RequestParam(name = "type", required = false) String type);

  @GetMapping("")
  Mono<PagedResponse<PaymentDto>> getRecentPayments(
      @RequestParam(required = false, defaultValue = "0") int page,
      @RequestParam(required = false, defaultValue = "10") int size);
}
