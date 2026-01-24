package it.andmora.expensesmonitor.backend.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity.CsrfSpec;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
public class WebSecurityConfig {

  @Value("${frontend.origins}")
  private String frontendOrigins;

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    // Split comma-separated origins
    List<String> origins = List.of(frontendOrigins.split(","));
    configuration.setAllowedOrigins(origins);
    configuration.setAllowedMethods(List.of("GET", "POST", "DELETE"));
    configuration.setAllowedHeaders(List.of("Cache-Control", "Content-Type", "Authorization"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    http
        .csrf(CsrfSpec::disable)
        .cors(customizer -> customizer.configurationSource(corsConfigurationSource()))
        .authorizeExchange(exchanges -> exchanges
            .pathMatchers("/actuator/health", "/actuator/health/*", "/*/swagger-ui/*",
                "/swagger-ui*", "/v3/api-docs/*",
                "/v3/api-docs")
            .permitAll()
            .anyExchange().authenticated()
        )
        .oauth2ResourceServer(customizer -> customizer.jwt(Customizer.withDefaults()));

    return http.build();
  }
}