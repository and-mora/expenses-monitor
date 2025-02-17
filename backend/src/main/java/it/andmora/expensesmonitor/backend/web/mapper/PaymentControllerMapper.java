package it.andmora.expensesmonitor.backend.web.mapper;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentControllerMapper {

  @Mapping(target = "wallet.name", source = "wallet")
  @Mapping(target = "tags", source = "tags", defaultExpression = "java(new ArrayList<>())")
  Payment dtoToEntity(PaymentDto paymentDto);

  @Mapping(target = "wallet", source = "wallet.id")
  PaymentDto entityToDto(Payment payment);
}
