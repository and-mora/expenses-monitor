package it.andmora.expensesmonitor.client.web;

import feign.Headers;
import feign.Param;
import feign.RequestLine;
import reactivefeign.spring.config.ReactiveFeignClient;
import reactor.core.publisher.Mono;

@ReactiveFeignClient(name = "backendApi")
@Headers("Authorization: {authToken}")
public interface BackendApi {

  @RequestLine("GET /greet")
  Mono<String> getGreet(@Param("authToken") String authToken);

}
