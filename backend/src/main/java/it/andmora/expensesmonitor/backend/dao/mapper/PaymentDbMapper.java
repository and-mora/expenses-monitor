package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentWithWalletNameProjection;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  @Mapping(target = "walletId", source = "wallet.id")
  PaymentDbEntity domainToDbEntity(Payment payment);

  @Mapping(target = "wallet.id", source = "walletId")
  @Mapping(target = "tags", expression = "java(new java.util.ArrayList<>())")
  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);

  @Mapping(target = "wallet.name", source = "walletName")
  @Mapping(target = "tags", expression = "java(new java.util.ArrayList<>())")
  @Mapping(target = "amountInCents", source = "amount")
  Payment dbEntityWithWalletNameToDomain(PaymentWithWalletNameProjection paymentDbEntity);

}
