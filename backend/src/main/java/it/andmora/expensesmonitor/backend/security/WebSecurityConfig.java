package it.andmora.expensesmonitor.backend.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity.CsrfSpec;
import org.springframework.security.core.userdetails.MapReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class WebSecurityConfig {

  @Value("${basic-auth.username}")
  private String username;
  @Value("${basic-auth.password}")
  private String password;

  @Value("${frontend.origin}")
  private String frontendOrigin;

  @Bean
  public MapReactiveUserDetailsService userDetailsService() {
    UserDetails user = User.withUsername(this.username)
        .password(password)
        .roles("USER")
        .build();

    return new MapReactiveUserDetailsService(user);
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(frontendOrigin));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    http
        .csrf(CsrfSpec::disable)
        .formLogin(formLoginSpec -> formLoginSpec
            .loginPage("/login")
            .authenticationSuccessHandler((webFilterExchange, authentication) -> Mono.empty())
            .authenticationEntryPoint(unauthorizedEntryPoint())
            .authenticationFailureHandler(unauthorizedOnFailure())
        )
        .authorizeExchange(exchanges -> exchanges
            .pathMatchers("/actuator/health", "/*/swagger-ui/*", "/swagger-ui*", "/v3/api-docs/*", "/v3/api-docs")
            .permitAll()
            .anyExchange().authenticated()
        )
        .logout(logoutSpec -> logoutSpec.logoutSuccessHandler(
            (exchange, authentication) -> Mono.empty()));

    return http.build();
  }

  private ServerAuthenticationEntryPoint unauthorizedEntryPoint() {
    return (exchange, ex) -> {
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse()
          .writeWith(Mono.just(exchange.getResponse().bufferFactory()
              .wrap(new byte[]{})));
    };
  }

  private ServerAuthenticationFailureHandler unauthorizedOnFailure() {
    return (webFilterExchange, exception) -> {
      webFilterExchange.getExchange().getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return webFilterExchange.getExchange().getResponse()
          .writeWith(Mono.just(webFilterExchange.getExchange().getResponse().bufferFactory()
              .wrap(new byte[]{})));
    };
  }
}