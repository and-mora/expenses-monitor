package it.andmora.expensesmonitor.backend.domain;

import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.util.UUID;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface WalletDao {

  Mono<Wallet> saveWallet(Wallet wallet);

  Flux<Wallet> getWallets();

  Mono<Void> deleteWallet(UUID walletId);

  Mono<Wallet> findByName(String name);
}
