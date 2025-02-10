package it.andmora.expensesmonitor.backend.dao;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import it.andmora.expensesmonitor.backend.dao.dbmodel.WalletDbEntity;
import it.andmora.expensesmonitor.backend.dao.mapper.WalletDbMapper;
import it.andmora.expensesmonitor.backend.dao.persistance.WalletRepository;
import it.andmora.expensesmonitor.backend.domain.errors.WalletNotEmptyException;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class WalletDaoImplTest {

  @Mock
  private WalletRepository repository;
  @Mock
  private WalletDbMapper walletMapper;
  private WalletDaoImpl walletDao;

  private Wallet wallet;
  private UUID walletId;

  @BeforeEach
  void setUp() {
    walletId = UUID.randomUUID();
    wallet = Wallet.builder().id(walletId).name("Test Wallet").build();
    walletDao = new WalletDaoImpl(repository, walletMapper);
  }

  @Test
  void testSaveWallet() {
    when(walletMapper.domainToDbEntity(any(Wallet.class))).thenReturn(WalletDbEntity.builder()
        .build());
    when(repository.save(any(WalletDbEntity.class))).thenReturn(Mono.just(WalletDbEntity.builder()
        .build()));
    when(walletMapper.dbEntityToDomain(any(WalletDbEntity.class))).thenReturn(wallet);

    Mono<Wallet> result = walletDao.saveWallet(wallet);

    StepVerifier.create(result)
        .expectNext(wallet)
        .expectComplete()
        .verify();

    verify(repository).save(any(WalletDbEntity.class));
  }

  @Test
  void testGetWallets() {
    when(repository.findAll()).thenReturn(Flux.just(WalletDbEntity.builder()
        .build()));
    when(walletMapper.dbEntityToDomain(any(WalletDbEntity.class))).thenReturn(wallet);

    Flux<Wallet> result = walletDao.getWallets();

    StepVerifier.create(result)
        .expectNext(wallet)
        .expectComplete()
        .verify();

    verify(repository).findAll();
  }

  @Test
  void testDeleteWallet() {
    when(repository.deleteById(walletId)).thenReturn(Mono.empty());

    Mono<Void> result = walletDao.deleteWallet(walletId);

    StepVerifier.create(result)
        .expectComplete()
        .verify();

    verify(repository).deleteById(walletId);
  }
}