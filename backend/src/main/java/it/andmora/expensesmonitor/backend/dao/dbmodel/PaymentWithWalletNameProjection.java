package it.andmora.expensesmonitor.backend.dao.dbmodel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentWithWalletNameProjection(UUID id,
                                              BigDecimal amount,
                                              LocalDate accountingDate,
                                              String merchantName,
                                              String description,
                                              String category,
                                              String walletName) {

}