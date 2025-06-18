package it.andmora.expensesmonitor.backend.dao.persistance;

import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentDbEntity;
import it.andmora.expensesmonitor.backend.dao.dbmodel.PaymentWithWalletNameProjection;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

/**
 * The persistance layer implements the repository or anything needed to persist the domain objects
 */
public interface PaymentPostgresRepository extends ReactiveCrudRepository<PaymentDbEntity, UUID> {

  @Query("SELECT DISTINCT p.category FROM expenses.payments p")
  Flux<String> getCategories();

  @Query("SELECT p.id, p.amount, p.merchant_name, p.description, p.category, p.accounting_date, w.name AS wallet_name FROM expenses.payments p JOIN expenses.wallets w ON p.wallet_id = w.id ORDER BY p.accounting_date DESC LIMIT :#{#pageable.pageSize} OFFSET :#{#pageable.offset}")
  Flux<PaymentWithWalletNameProjection> findAllWithWalletNameByOrderByAccountingDateDesc(Pageable pageable);
}
