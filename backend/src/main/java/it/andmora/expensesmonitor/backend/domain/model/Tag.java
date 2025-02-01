package it.andmora.expensesmonitor.backend.domain.model;

import java.util.UUID;
import lombok.Builder;

@Builder
public record Tag (UUID id, String key, String value) {

}
