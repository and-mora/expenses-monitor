package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Slf4j
@Service
public class WalletService {

  private WalletDao walletDao;

  public Mono<Wallet> createWallet(String name) {
    return walletDao.saveWallet(Wallet.builder()
        .id(UUID.randomUUID())
        .name(name)
        .build());
  }

  public Flux<Wallet> getWallets() {
    return walletDao.getWallets();
  }

  public Mono<Void> deleteWallet(UUID walletId) {
    return walletDao.deleteWallet(walletId);
  }
}
