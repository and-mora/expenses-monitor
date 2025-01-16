package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.PaymentDao;
import it.andmora.expensesmonitor.backend.domain.WalletDao;
import it.andmora.expensesmonitor.backend.domain.WalletNotFoundException;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
@Slf4j
class PaymentCreatorImpl implements PaymentCreator {

  private final PaymentDao paymentDao;
  private final WalletDao walletDao;

  @Override
  public Mono<Payment> createPayment(Payment payment) {

    // check if the wallet exists
    return walletDao.findByName(payment.getWallet().getName())
        .switchIfEmpty(Mono.error(new WalletNotFoundException(payment.getWallet())))
        .flatMap(wallet -> paymentDao.savePayment(payment))
        .doOnError(WalletNotFoundException.class,
            a -> log.info("Wallet {} not found in the database", payment.getWallet().getName()));
  }
}
