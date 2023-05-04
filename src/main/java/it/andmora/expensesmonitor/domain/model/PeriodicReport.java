package it.andmora.expensesmonitor.domain.model;


import java.time.LocalDateTime;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class PeriodicReport {

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

  public void addVoice(String field, int amount) {
    dataMap.computeIfPresent(field, (key, oldValue) -> oldValue + amount);
    dataMap.putIfAbsent(field, amount);
  }
}
