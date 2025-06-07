package it.andmora.expensesmonitor.backend.web.dto;

import java.util.List;

public record PagedResponse<T>(List<T> content,
                               int page,
                               int size) {

}