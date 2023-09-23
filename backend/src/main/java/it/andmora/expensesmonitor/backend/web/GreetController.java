package it.andmora.expensesmonitor.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RequestMapping("greet")
@RestController
public class GreetController {

  @GetMapping
  Mono<String> getGreet() {
    return Mono.just("greetings!");
  }
}
