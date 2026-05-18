package com.semiconductor.woms.backend.exception;

import com.semiconductor.woms.backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
    public ResponseEntity<ApiResponse> handleCustomerNotFound(CustomerNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(400, ex.getMessage()));
    }

    // 處理手動拋出的 ResponseStatusException (如: 找不到訂單時拋出的 404)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse> handleStatusException(ResponseStatusException ex) {
        ApiResponse response = new ApiResponse(
                ex.getStatusCode().value(),
                ex.getReason()
        );
        return new ResponseEntity<>(response, ex.getStatusCode());
    }

    // 處理所有未預期的系統錯誤 (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneralException(Exception ex) {
        ApiResponse response = new ApiResponse(
                500,
                "伺服器發生非預期錯誤：" + ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}