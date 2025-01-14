package it.andmora.expensesmonitor.backend.web.mapper;

import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import it.andmora.expensesmonitor.backend.web.dto.WalletDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WalletControllerMapper {

  @Mapping(target = "id", ignore = true)
  Wallet dtoToEntity(WalletDto walletDto);

  WalletDto entityToDto(Wallet wallet);
}
