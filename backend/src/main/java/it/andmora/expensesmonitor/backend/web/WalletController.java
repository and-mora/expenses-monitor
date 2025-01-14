package it.andmora.expensesmonitor.backend.web;

import it.andmora.expensesmonitor.backend.web.dto.WalletDto;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequestMapping("api/wallets")
public interface WalletController {

  @PostMapping("")
  Mono<WalletDto> createWallet(@RequestBody WalletDto walletDto);

  @GetMapping("")
  Flux<WalletDto> getWallets();

  @DeleteMapping("/{id}")
  Mono<Void> deleteWallet(@PathVariable("id") UUID walletId);
}
