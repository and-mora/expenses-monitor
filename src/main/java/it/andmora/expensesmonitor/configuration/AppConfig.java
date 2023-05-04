package it.andmora.expensesmonitor.configuration;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.ReportDao;
import it.andmora.expensesmonitor.domain.usecase.BalanceCalculator;
import it.andmora.expensesmonitor.domain.usecase.BalanceCalculatorImpl;
import it.andmora.expensesmonitor.domain.usecase.MonthlyReportService;
import it.andmora.expensesmonitor.domain.usecase.MonthlyReportServiceImpl;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreator;
import it.andmora.expensesmonitor.domain.usecase.PaymentCreatorImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

  @Bean
  public PaymentCreator getPaymentCreator(PaymentDao paymentDao) {
    return new PaymentCreatorImpl(paymentDao);
  }

  @Bean
  public BalanceCalculator getBalanceCalculator(PaymentDao paymentDao) {
    return new BalanceCalculatorImpl(paymentDao);
  }

  @Bean
  public MonthlyReportService getMonthlyReport(ReportDao reportDao) {
    return new MonthlyReportServiceImpl(reportDao);
  }

}
