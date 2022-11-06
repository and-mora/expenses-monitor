package it.andmora.expensesmonitor.web.mapper;

import it.andmora.expensesmonitor.domain.entity.Payment;
import it.andmora.expensesmonitor.web.dto.PaymentDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentControllerMapper {

  Payment dtoToEntity(PaymentDto paymentDto);

  PaymentDto entityToDto(Payment payment);
}
