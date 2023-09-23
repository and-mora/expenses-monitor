package it.andmora.expensesmonitor.client.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class HomepageController {

  private final BackendApi backendApi;

  public HomepageController(BackendApi backendApi) {
    this.backendApi = backendApi;
  }

  @GetMapping("/data")
  Mono<String> data() {
    return backendApi.getGreet();
  }

  @GetMapping("/public/data")
  String publicData() {
    return "public data";
  }
}