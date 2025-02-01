package it.andmora.expensesmonitor.backend.domain.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Objects;
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
                      Wallet wallet,
                      Collection<Tag> tags) {

  public Payment toPaymentWithWallet(Wallet wallet) {
    return Payment.builder()
        .id(this.id)
        .description(this.description)
        .amountInCents(this.amountInCents)
        .merchantName(this.merchantName)
        .accountingDate(this.accountingDate)
        .category(this.category)
        .wallet(wallet)
        .tags(this.tags)
        .build();
  }

  public Payment toPaymentWithTags(Collection<Tag> tags) {
    return Payment.builder()
        .id(this.id)
        .description(this.description)
        .amountInCents(this.amountInCents)
        .merchantName(this.merchantName)
        .accountingDate(this.accountingDate)
        .category(this.category)
        .wallet(this.wallet)
        .tags(tags)
        .build();
  }

  public Payment addTag(Tag tag) {
    var tags = Objects.requireNonNullElse(this.tags(), new ArrayList<Tag>());
    tags.add(tag);
    return toPaymentWithTags(tags);
  }

}
