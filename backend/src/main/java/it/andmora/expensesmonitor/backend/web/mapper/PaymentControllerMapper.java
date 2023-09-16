package it.andmora.expensesmonitor.backend.web.mapper;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.web.dto.PaymentDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentControllerMapper {

  Payment dtoToEntity(PaymentDto paymentDto);

  PaymentDto entityToDto(Payment payment);
}
