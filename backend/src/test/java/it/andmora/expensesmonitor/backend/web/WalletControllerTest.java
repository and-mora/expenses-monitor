package it.andmora.expensesmonitor.backend.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import it.andmora.expensesmonitor.backend.domain.errors.WalletAlreadyPresent;
import it.andmora.expensesmonitor.backend.domain.errors.WalletNotEmptyException;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import it.andmora.expensesmonitor.backend.domain.usecase.WalletService;
import it.andmora.expensesmonitor.backend.web.dto.ErrorDto;
import it.andmora.expensesmonitor.backend.web.dto.WalletDto;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WalletControllerTest {

  @MockitoBean
  WalletService walletService;
  @Autowired
  WalletController walletController;
  LocalDateTime dateInjected = LocalDateTime.now();
  WebTestClient webTestClient;
  private static final String POST_WALLET_ENDPOINT = "/api/wallets";
  private static final String GET_WALLET_ENDPOINT = "/api/wallets";

  @Autowired
  ApplicationContext context;

  @BeforeEach
  public void setup() {
    this.webTestClient = WebTestClient
        .bindToApplicationContext(this.context)
        // add Spring Security test Support
        .apply(springSecurity())
        .configureClient()
        .build();
  }

  @Test
  void whenDeleteWalletThenReturnsOk() {
    Mockito.when(walletService.deleteWallet(any())).thenReturn(Mono.empty());

    var paymentResponse = walletController.deleteWallet(UUID.randomUUID());

    Mockito.verify(walletService).deleteWallet(any());
    StepVerifier
        .create(paymentResponse)
        .expectComplete()
        .verify();
  }

  @Test
  @WithMockUser
  void whenDeleteWalletThenReturns422() {
    var uuid = UUID.randomUUID();
    Mockito.when(walletService.deleteWallet(any()))
        .thenReturn(Mono.error(new WalletNotEmptyException(uuid)));

    webTestClient
        .mutate().build()
        .delete()
        .uri(uriBuilder -> uriBuilder.path(POST_WALLET_ENDPOINT)
            .pathSegment(uuid.toString()).build())
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

    Mockito.verify(walletService).deleteWallet(any());
  }

  @Test
  @WithMockUser
  void whenAddWalletAlreadyPresentThenReturns409() {
    Mockito.when(walletService.createWallet(any()))
        .thenReturn(Mono.error(new WalletAlreadyPresent("test")));
    WalletDto walletDto = createWalletDto();

    webTestClient
        .mutate().build()
        .post()
        .uri(POST_WALLET_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(walletDto)
        .exchange()
        .expectStatus().isEqualTo(HttpStatus.CONFLICT)
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .expectBody(ErrorDto.class)
        .value(error -> assertThat(error.code()).isEqualTo("WALLET_ALREADY_PRESENT"));

    Mockito.verify(walletService).createWallet(any());
  }

  @Test
  @WithMockUser
  void givenAuthWhenCreateWalletIsCalledThen200() {
    Mockito.when(walletService.createWallet(any())).thenReturn(Mono.just(Wallet.builder().id(
        UUID.randomUUID()).name("shopping").build()));
    WalletDto walletDto = createWalletDto();

    webTestClient
        .mutate().build()
        .post()
        .uri(POST_WALLET_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(walletDto)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .expectBody(WalletDto.class).value(wallet -> {
          assertThat(wallet.name()).isEqualTo("shopping");
          assertThat(wallet.id()).isNotNull();
        });
  }

  @Test
  @WithMockUser
  void whenGetWalletsIsCalledThen200() {
    Mockito.when(walletService.getWallets()).thenReturn(getFakeWallets());

    webTestClient
        .mutate().build()
        .get()
        .uri(uriBuilder -> uriBuilder
            .path(GET_WALLET_ENDPOINT)
            .build())
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType("application/json")
        .expectBodyList(WalletDto.class).contains(
            new WalletDto(null, "wallet1"),
            new WalletDto(null, "wallet2")
        );

    Mockito.verify(walletService).getWallets();
  }

  private Flux<Wallet> getFakeWallets() {
    return Flux.just(
        Wallet.builder().name("wallet1").build(),
        Wallet.builder().name("wallet2").build());
  }

  @Test
  void givenNoAuthWhenRestInterfaceIsCalledThen401() {
    Mockito.when(walletService.createWallet(any())).thenReturn(Mono.just(Wallet.builder().build()));
    WalletDto walletDto = createWalletDto();

    webTestClient
        .put()
        .uri(POST_WALLET_ENDPOINT)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(walletDto)
        .exchange()
        .expectStatus().isUnauthorized();
  }

  WalletDto createWalletDto() {
    return new WalletDto(null, "shopping");
  }

}