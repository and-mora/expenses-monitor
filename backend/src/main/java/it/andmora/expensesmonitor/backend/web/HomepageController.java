package it.andmora.expensesmonitor.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomepageController {

  @GetMapping
  String homepage() {
    return "Hello";
  }

}
