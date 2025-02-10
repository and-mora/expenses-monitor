package it.andmora.expensesmonitor.backend.web;


import it.andmora.expensesmonitor.backend.domain.errors.WalletNotEmptyException;
import it.andmora.expensesmonitor.backend.web.dto.ErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class WalletExceptionHandler {

  @ExceptionHandler(WalletNotEmptyException.class)
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  public ResponseEntity<ErrorDto> handleWalletNotEmpty(WalletNotEmptyException ex) {
    ErrorDto errorDto = new ErrorDto("WALLET_NOT_EMPTY", ex.getMessage());
    return ResponseEntity.unprocessableEntity().body(errorDto);
  }
}
