package it.andmora.expensesmonitor.backend.domain.errors;

import java.util.UUID;

public class WalletNotEmptyException extends RuntimeException {

  public WalletNotEmptyException(UUID walletId) {
    super("Cannot delete wallet " + walletId + ". Remove all transactions first.");
  }
}
