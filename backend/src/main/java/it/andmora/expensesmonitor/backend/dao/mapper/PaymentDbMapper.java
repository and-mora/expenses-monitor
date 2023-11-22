package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  PaymentDbEntity domainToDbEntity(Payment payment);

  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);

}
