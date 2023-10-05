package it.andmora.expensesmonitor.client.web;

import feign.FeignException;
import java.util.Objects;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RestControllerAdvice
public class ControllerUnAuthHandler {

  @ExceptionHandler(FeignException.class)
  Mono<ResponseEntity<String>> handleUnAuth(FeignException feignException,
      ServerWebExchange exchange) {
    if (feignException.status() == 401) {
      return Mono.just(
          ResponseEntity.status(401).header("Www-Authenticate", "Basic realm=\"Realm\"").build());
    }
    return Mono.just(ResponseEntity.status(
        Objects.requireNonNull(exchange.getResponse().getStatusCode())).build());
  }

}
