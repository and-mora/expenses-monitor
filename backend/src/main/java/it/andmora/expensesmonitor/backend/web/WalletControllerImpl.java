package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.domain.usecase.WalletService;
import it.andmora.expensesmonitor.backend.web.dto.WalletDto;
import it.andmora.expensesmonitor.backend.web.mapper.WalletControllerMapper;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@RequiredArgsConstructor
public class WalletControllerImpl implements WalletController {

  private final WalletService walletService;
  private final WalletControllerMapper mapper;

  @Override
  public Mono<WalletDto> createWallet(WalletDto walletDto) {
    log.info("Creation of a new wallet {}", walletDto.name());
    return walletService
        .createWallet(walletDto.name())
        .map(mapper::entityToDto);
  }

  @Override
  public Flux<WalletDto> getWallets() {
    log.info("Retrieving wallets...");
    return walletService
        .getWallets()
        .map(mapper::entityToDto);
  }

  @Override
  public Mono<Void> deleteWallet(UUID walletId) {
    log.info("Deletion of wallet with id: {}", walletId);
    return walletService
        .deleteWallet(walletId);
  }
}
