package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  @Mapping(ignore = true, target = "id")
  PaymentDbEntity domainToDbEntity(Payment payment);

  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);

}
