package it.andmora.expensesmonitor.client.config;

import it.andmora.expensesmonitor.client.web.BackendApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactivefeign.jetty.JettyReactiveFeign;
import reactivefeign.spring.config.EnableReactiveFeignClients;

@Configuration
@EnableReactiveFeignClients
public class RestConnectorConfig {

  @Value("${feign.url}")
  private String feignUrl;

  @Bean
  BackendApi backendApi() {
    return JettyReactiveFeign
        .<BackendApi>builder()
        .target(BackendApi.class, feignUrl);
  }

}
