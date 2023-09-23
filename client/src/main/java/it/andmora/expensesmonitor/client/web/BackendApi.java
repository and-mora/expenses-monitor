package it.andmora.expensesmonitor.client.web;

import feign.RequestLine;
import reactivefeign.spring.config.ReactiveFeignClient;
import reactor.core.publisher.Mono;

@ReactiveFeignClient(name = "backendApi")
public interface BackendApi {

  @RequestLine("GET /greet")
  Mono<String> getGreet();
}
