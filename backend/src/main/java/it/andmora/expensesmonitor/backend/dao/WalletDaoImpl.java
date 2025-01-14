package it.andmora.expensesmonitor.backend.dao;

import it.andmora.expensesmonitor.backend.dao.mapper.WalletDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.WalletRepository;
import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Implementation of Dao consists of interconnections between the Dao interface and the repository.
 * It's used to decouple the interface for the use cases and the real implementation of persistance
 * layer
 */
@Component
@RequiredArgsConstructor
class WalletDaoImpl implements WalletDao {

  private final WalletRepository repository;
  private final WalletDbMapper walletMapper;

  @Override
  public Mono<Wallet> saveWallet(Wallet wallet) {
    return repository
        .save(walletMapper.domainToDbEntity(wallet))
        .map(walletMapper::dbEntityToDomain);
  }

  @Override
  public Flux<Wallet> getWallets() {
    return repository
        .findAll()
        .map(walletMapper::dbEntityToDomain);
  }

  @Override
  public Mono<Void> deleteWallet(UUID walletId) {
    return repository
        .deleteById(walletId);
  }

}
