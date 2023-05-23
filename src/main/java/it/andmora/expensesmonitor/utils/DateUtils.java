package it.andmora.expensesmonitor.utils;

import java.time.LocalDateTime;

public class DateUtils {

  private DateUtils() {
  }

  public static LocalDateTime getStartOfMonthDate(int month, int year) {
    return LocalDateTime.of(year, month, 1, 0, 0);
  }

  public static LocalDateTime getEndOfMonthDate(int month, int year) {
    return getStartOfMonthDate(month, year).plusMonths(1).minusNanos(1);
  }
}
