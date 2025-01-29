package it.andmora.expensesmonitor.backend.dao.persistance;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentTagDbEntity;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface PaymentTagRepository extends ReactiveCrudRepository<PaymentTagDbEntity, UUID> {

}
