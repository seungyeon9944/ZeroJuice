package com.zerojuice.global.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공통 API 에러 응답 형식
 * {
 * "success": false,
 * "error": {
 * "message": "에러 메시지",
 * "errorCode": "ERROR_CODE"
 * }
 * }
 */
@Getter
@Builder
@AllArgsConstructor
public class ErrorResponse {

    private final boolean success;
    private final ErrorDetail error;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ErrorDetail {
        private final String message;
        private final String errorCode;
    }

    public static ErrorResponse of(ErrorCode errorCode) {
        return ErrorResponse.builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .message(errorCode.getMessage())
                        .errorCode(errorCode.getCode())
                        .build())
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String customMessage) {
        return ErrorResponse.builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .message(customMessage)
                        .errorCode(errorCode.getCode())
                        .build())
                .build();
    }

    public static ErrorResponse of(String errorCode, String message) {
        return ErrorResponse.builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .message(message)
                        .errorCode(errorCode)
                        .build())
                .build();
    }
}
