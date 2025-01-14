package it.andmora.expensesmonitor.backend.web.dto;

import java.util.UUID;
import lombok.Builder;

@Builder
public record WalletDto(UUID id, String name) {

}
