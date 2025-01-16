package it.andmora.expensesmonitor.backend.web.dto;

import lombok.Builder;

@Builder
public record ErrorDto(String code, String detail) {

}
