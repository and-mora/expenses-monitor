package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  @Mapping(target = "wallet", source = "wallet.name")
  PaymentDbEntity domainToDbEntity(Payment payment);

  @Mapping(target = "wallet.name", source = "wallet")
  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);

}
