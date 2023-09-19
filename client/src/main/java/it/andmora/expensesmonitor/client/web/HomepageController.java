package it.andmora.expensesmonitor.client.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomepageController {

  @GetMapping("/data")
  String data() {
    return "PRIVATE data";
  }

  @GetMapping("/public/data")
  String publicData() {
    return "public data";
  }
}