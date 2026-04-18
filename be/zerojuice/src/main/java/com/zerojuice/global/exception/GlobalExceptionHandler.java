package com.zerojuice.global.exception;

import com.zerojuice.global.common.ErrorCode;
import com.zerojuice.global.common.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        /**
         * 커스텀 비즈니스 예외 처리
         */
        @ExceptionHandler(CustomException.class)
        public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
                log.warn("CustomException: {} - {}", e.getErrorCode().getCode(), e.getMessage());
                ErrorCode errorCode = e.getErrorCode();
                return ResponseEntity
                                .status(errorCode.getHttpStatus())
                                .body(ErrorResponse.of(errorCode, e.getMessage()));
        }

        /**
         * Validation 예외 처리 (@Valid)
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
                String errorMessage = e.getBindingResult().getFieldErrors().stream()
                                .map(FieldError::getDefaultMessage)
                                .collect(Collectors.joining(", "));
                log.warn("Validation Error: {}", errorMessage);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT, errorMessage));
        }

        /**
         * 요청 파라미터 누락 예외 처리
         */
        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(
                        MissingServletRequestParameterException e) {
                String errorMessage = String.format("필수 파라미터 '%s'가 누락되었습니다.", e.getParameterName());
                log.warn("Missing Parameter: {}", errorMessage);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(ErrorCode.MISSING_PARAMETER, errorMessage));
        }

        /**
         * 타입 불일치 예외 처리
         */
        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException e) {
                String errorMessage = String.format("파라미터 '%s'의 타입이 올바르지 않습니다.", e.getName());
                log.warn("Type Mismatch: {}", errorMessage);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT, errorMessage));
        }

        /**
         * JSON 파싱 오류 처리
         */
        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
                log.warn("JSON Parse Error: {}", e.getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(ErrorCode.BAD_REQUEST, "요청 본문을 읽을 수 없습니다."));
        }

        /**
         * 지원하지 않는 HTTP 메서드 예외 처리
         */
        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupported(
                        HttpRequestMethodNotSupportedException e) {
                log.warn("Method Not Supported: {}", e.getMethod());
                return ResponseEntity
                                .status(HttpStatus.METHOD_NOT_ALLOWED)
                                .body(ErrorResponse.of("METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메서드입니다."));
        }

        /**
         * 404 Not Found 예외 처리
         */
        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ErrorResponse> handleNoHandlerFoundException(NoHandlerFoundException e) {
                log.warn("No Handler Found: {} {}", e.getHttpMethod(), e.getRequestURL());
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(ErrorResponse.of(ErrorCode.NOT_FOUND));
        }

        /**
         * 기타 모든 예외 처리
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleException(Exception e) {
                log.error("Unexpected Error: ", e);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ErrorResponse.of(ErrorCode.INTERNAL_ERROR));
        }
}
