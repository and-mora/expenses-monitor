package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentTagDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Tag;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentTagDbMapper {

  PaymentTagDbEntity domainToDbEntity(Tag tag);

  Tag dbEntityToDomain(PaymentTagDbEntity tagDbEntity);

}
