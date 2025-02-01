package it.andmora.expensesmonitor.backend.domain;

import it.andmora.expensesmonitor.backend.domain.model.Wallet;

public class WalletNotFoundException extends RuntimeException {

  public WalletNotFoundException(Wallet wallet) {
    super("Wallet " + wallet.id() + " does not exist. Please create it first.");
  }

}
