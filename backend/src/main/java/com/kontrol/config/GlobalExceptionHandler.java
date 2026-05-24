package com.kontrol.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    public ResponseEntity<Map<String, String>> handleUnsupported(UnsupportedOperationException ex) {
        return ResponseEntity.status(501).body(Map.of("error", "Not implemented: " + ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        log.error("Unhandled runtime exception: {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
    }
}
