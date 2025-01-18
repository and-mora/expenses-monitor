package it.andmora.expensesmonitor.backend.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

/**
 * Domain object to represent the single payment
 */
@Builder

public record Payment(UUID id,
                      String description,
                      int amountInCents,
                      String merchantName,
                      LocalDateTime accountingDate,
                      String category,
                      Wallet wallet) {

  public Payment toPaymentWithWallet(Wallet wallet) {
    return Payment.builder()
        .id(this.id)
        .description(this.description)
        .amountInCents(this.amountInCents)
        .merchantName(this.merchantName)
        .accountingDate(this.accountingDate)
        .category(this.category)
        .wallet(wallet)
        .build();
  }

}
