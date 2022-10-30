package it.andmora.expensesmonitor.web.mapper;

import it.andmora.expensesmonitor.web.dto.PaymentDto;
import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.domain.entity.PaymentType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface PaymentControllerMapper {

  @Mapping(source = "incomeVoice", target = "paymentType", qualifiedByName = "booleanToPaymentType")
  Payment dtoToEntity(PaymentDto paymentDto);

  @Mapping(source = "paymentType", target = "isIncomeVoice", qualifiedByName = "paymentTypeToBoolean")
  PaymentDto entityToDto(Payment payment);

  @Named("booleanToPaymentType")
  default PaymentType booleanToPaymentType(boolean isIncome) {
    return isIncome ? PaymentType.INCOME : PaymentType.OUTCOME;
  }

  @Named("paymentTypeToBoolean")
  default boolean paymentTypeToBoolean(PaymentType paymentType) {
    return PaymentType.INCOME.equals(paymentType);
  }
}
