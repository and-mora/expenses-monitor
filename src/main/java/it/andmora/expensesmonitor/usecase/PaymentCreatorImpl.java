package it.andmora.expensesmonitor.usecase;

import it.andmora.expensesmonitor.dao.PaymentDao;
import it.andmora.expensesmonitor.domain.dto.PaymentDto;
import it.andmora.expensesmonitor.domain.entity.Payment;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class PaymentCreatorImpl implements PaymentCreator {

    private final PaymentDao paymentDao;

    @Override
    public Payment createPayment(PaymentDto paymentDto) {
        // is there validation needed here?


        // conversion to entity object
        Payment paymentToBeSaved = null;
        
        // persistance
        return paymentDao.savePayment(paymentToBeSaved);
    }
}
