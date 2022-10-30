package it.andmora.expensesmonitor.dao.mapper;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.domain.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  @Mapping(ignore = true, target = "id")
  PaymentDbEntity domainToDbEntity(Payment payment);

  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);
}
