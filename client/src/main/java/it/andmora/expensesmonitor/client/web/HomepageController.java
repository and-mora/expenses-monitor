package it.andmora.expensesmonitor.client.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
public class HomepageController {

  private final BackendApi backendApi;

  @GetMapping("/greet")
  Mono<String> greet(
      @RequestHeader(defaultValue = "noAuth", name = "Authorization") String basicAuth) {
    return backendApi.getGreet(basicAuth);
  }

  @GetMapping("/public/data")
  String publicData() {
    return "public data";
  }
}