package it.andmora.expensesmonitor.backend.dao.mapper;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.domain.model.Payment;
import it.andmora.expensesmonitor.backend.dao.dbmodel.TagDbEntity;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentDbMapper {

  @Mapping(ignore = true, target = "id")
  PaymentDbEntity domainToDbEntity(Payment payment);

  Payment dbEntityToDomain(PaymentDbEntity paymentDbEntity);

  default Set<TagDbEntity> mapStringToTags(Set<String> value) {
    return value.stream().map(val -> TagDbEntity.builder().tagName(val).build()).collect(Collectors.toSet());
  }

  default Set<String> mapTagsToString(Set<TagDbEntity> value) {
    return value.stream().map(TagDbEntity::getTagName).collect(Collectors.toSet());
  }
}
