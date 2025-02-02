package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentTagDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentTagDbMapper {

  @Mapping(target = "paymentId", ignore = true)
  PaymentTagDbEntity domainToDbEntity(Tag tag);

  Tag dbEntityToDomain(PaymentTagDbEntity tagDbEntity);

}
