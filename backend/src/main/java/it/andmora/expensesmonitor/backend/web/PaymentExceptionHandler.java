package it.andmora.expensesmonitor.backend.web;


import it.andmora.expensesmonitor.backend.domain.WalletNotFoundException;
import it.andmora.expensesmonitor.backend.web.dto.ErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class PaymentExceptionHandler {

  @ExceptionHandler(WalletNotFoundException.class)
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  public ResponseEntity<ErrorDto> handleWalletNotFound(WalletNotFoundException ex) {
    ErrorDto errorDto = new ErrorDto("WALLET_NOT_FOUND", ex.getMessage());
    return ResponseEntity.unprocessableEntity().body(errorDto);
  }
}
