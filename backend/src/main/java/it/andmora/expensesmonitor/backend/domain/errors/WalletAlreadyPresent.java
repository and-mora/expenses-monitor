package it.andmora.expensesmonitor.backend.domain.errors;

public class WalletAlreadyPresent extends RuntimeException {

  public WalletAlreadyPresent(String walletName) {
    super("Wallet with name " + walletName + " already present.");
  }
}
