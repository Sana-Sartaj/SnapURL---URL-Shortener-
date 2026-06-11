package com.urlshortener.exception;

import com.urlshortener.dto.UrlDtos.ErrorResponse;
import com.urlshortener.dto.UrlDtos.RateLimitResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ShortCodeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ShortCodeNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(error(404, "Not Found", ex.getMessage()));
    }

    @ExceptionHandler(UrlExpiredException.class)
    public ResponseEntity<ErrorResponse> handleExpired(UrlExpiredException ex) {
        return ResponseEntity.status(HttpStatus.GONE)
            .body(error(410, "Gone", ex.getMessage()));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<RateLimitResponse> handleRateLimit(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
            .header("X-RateLimit-Limit", String.valueOf(ex.getLimit()))
            .header("X-RateLimit-Remaining", "0")
            .body(RateLimitResponse.builder()
                .message(ex.getMessage())
                .retryAfterSeconds(ex.getRetryAfterSeconds())
                .limit(ex.getLimit())
                .remaining(0)
                .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(error(400, "Bad Request", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(error(400, "Validation Failed", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error(500, "Internal Server Error", "An unexpected error occurred"));
    }

    private ErrorResponse error(int status, String error, String message) {
        return ErrorResponse.builder()
            .status(status)
            .error(error)
            .message(message)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
