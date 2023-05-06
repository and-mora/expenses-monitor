package it.andmora.expensesmonitor.domain.model;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyReport {

  /**
   * The key represent the aggregation field. The value represent the sum of every amount aggregated
   * under the corresponding key
   */
  private Map<String, Integer> dataMap;

  /**
   * Start date of the report
   */
  private LocalDateTime startDate;

  /**
   * End date of the report
   */
  private LocalDateTime endDate;

  public static MonthlyReport newInstance(LocalDateTime startDate, LocalDateTime endDate) {
    return MonthlyReport
        .builder()
        .dataMap(new HashMap<>())
        .startDate(startDate)
        .endDate(endDate)
        .build();
  }

  public void addVoice(String field, int amount) {
    dataMap.computeIfPresent(field, (key, oldValue) -> oldValue + amount);
    dataMap.putIfAbsent(field, amount);
  }
}
