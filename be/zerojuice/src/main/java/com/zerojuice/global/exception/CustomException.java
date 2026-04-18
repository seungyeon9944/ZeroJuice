package com.zerojuice.global.exception;

import com.zerojuice.global.common.ErrorCode;
import lombok.Getter;

/**
 * 커스텀 비즈니스 예외
 */
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}
