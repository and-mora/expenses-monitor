package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.WalletDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Wallet;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WalletDbMapper {

  WalletDbEntity domainToDbEntity(Wallet wallet);

  Wallet dbEntityToDomain(WalletDbEntity walletDbEntity);

}
