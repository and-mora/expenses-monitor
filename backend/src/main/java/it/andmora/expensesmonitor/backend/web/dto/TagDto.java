package it.andmora.expensesmonitor.backend.web.dto;

import java.util.UUID;

/**
 * Pojo used by the controller
 */
public record TagDto(UUID id, String key, String value) {

}
