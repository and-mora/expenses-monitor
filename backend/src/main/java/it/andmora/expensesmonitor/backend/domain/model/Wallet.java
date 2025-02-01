package it.andmora.expensesmonitor.backend.domain.model;

import java.util.UUID;
import lombok.Builder;

@Builder
public record Wallet(UUID id, String name) {

}
