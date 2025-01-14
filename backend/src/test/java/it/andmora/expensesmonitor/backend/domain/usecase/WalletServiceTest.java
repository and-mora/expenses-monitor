package it.andmora.expensesmonitor.backend.domain.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

  @Mock
  private WalletDao walletDao;

  @InjectMocks
  private WalletService walletService;

  private Wallet wallet;
  private UUID walletId;

  @BeforeEach
  void setUp() {
    walletId = UUID.randomUUID();
    wallet = Wallet.builder().id(walletId).name("Test Wallet").build();
  }

  @Test
  void testCreateWallet() {
    when(walletDao.saveWallet(any(Wallet.class))).thenReturn(Mono.just(wallet));

    Mono<Wallet> result = walletService.createWallet("Test Wallet");

    StepVerifier.create(result)
        .expectNext(wallet)
        .expectComplete()
        .verify();

    verify(walletDao).saveWallet(any(Wallet.class));
  }

  @Test
  void testGetWallets() {
    when(walletDao.getWallets()).thenReturn(Flux.just(wallet));

    Flux<Wallet> result = walletService.getWallets();

    StepVerifier.create(result)
        .expectNext(wallet)
        .expectComplete()
        .verify();

    verify(walletDao).getWallets();
  }

  @Test
  void testDeleteWallet() {
    when(walletDao.deleteWallet(walletId)).thenReturn(Mono.empty());

    Mono<Void> result = walletService.deleteWallet(walletId);

    StepVerifier.create(result)
        .expectComplete()
        .verify();

    verify(walletDao).deleteWallet(walletId);
  }
}