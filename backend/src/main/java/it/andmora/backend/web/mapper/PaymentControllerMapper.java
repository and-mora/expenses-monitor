package it.andmora.backend.web.mapper;

import it.andmora.backend.domain.model.Payment;
import it.andmora.backend.web.dto.PaymentDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentControllerMapper {

  Payment dtoToEntity(PaymentDto paymentDto);

  PaymentDto entityToDto(Payment payment);
}
