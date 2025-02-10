package it.andmora.expensesmonitor.backend.domain.errors;

public class WalletNotEmptyException extends Throwable {
    public WalletNotEmptyException() {
        super("Cannot delete wallet with payments");
    }
}
