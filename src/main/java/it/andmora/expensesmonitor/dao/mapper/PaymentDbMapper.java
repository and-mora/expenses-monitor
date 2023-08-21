package it.andmora.expensesmonitor.dao.mapper;

import it.andmora.expensesmonitor.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.dao.dbmodel.TagDbEntity;
import it.andmora.expensesmonitor.domain.model.Payment;
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
