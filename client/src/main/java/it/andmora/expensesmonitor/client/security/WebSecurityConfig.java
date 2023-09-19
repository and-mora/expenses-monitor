package it.andmora.expensesmonitor.client.security;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class WebSecurityConfig {

  @Bean
  SecurityWebFilterChain configure(ServerHttpSecurity http) {
    return http
        .authorizeExchange(authorize -> authorize
            .pathMatchers("/", "/public/**").permitAll()
            .anyExchange().authenticated()
        )
        .oauth2Login(withDefaults())
        .oauth2Client(withDefaults())
        .build();
  }

}
