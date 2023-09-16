package it.andmora.backend.dao.dbmodel;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("tags")
@Builder
@Data
public class TagDbEntity {

  @Id
  private int id;
  private String tagName;
}
