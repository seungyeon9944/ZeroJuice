package com.zerojuice.global.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 공통 에러 코드 정의
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 400 Bad Request
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "잘못된 요청입니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "입력값이 올바르지 않습니다."),
    MISSING_PARAMETER(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", "필수 파라미터가 누락되었습니다."),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "인증이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "EXPIRED_TOKEN", "만료된 토큰입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "아이디 또는 비밀번호가 올바르지 않습니다."),

    // 403 Forbidden
    FORBIDDEN(HttpStatus.FORBIDDEN, "FORBIDDEN", "접근 권한이 없습니다."),

    // 404 Not Found
    NOT_FOUND(HttpStatus.NOT_FOUND, "NOT_FOUND", "리소스를 찾을 수 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
    CAR_NOT_FOUND(HttpStatus.NOT_FOUND, "CAR_NOT_FOUND", "차량을 찾을 수 없습니다."),
    PARKING_SLOT_NOT_FOUND(HttpStatus.NOT_FOUND, "PARKING_SLOT_NOT_FOUND", "주차면을 찾을 수 없습니다."),
    PARKING_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "PARKING_RECORD_NOT_FOUND", "주차 기록을 찾을 수 없습니다."),

    // 409 Conflict
    DUPLICATE_MOBILE(HttpStatus.CONFLICT, "DUPLICATE_MOBILE", "이미 등록된 휴대폰 번호입니다."),
    DUPLICATE_CAR_NO(HttpStatus.CONFLICT, "DUPLICATE_CAR_NO", "이미 등록된 차량 번호입니다."),
    ALREADY_PARKING(HttpStatus.CONFLICT, "ALREADY_PARKING", "이미 주차 중인 차량입니다."),
    SLOT_NOT_AVAILABLE(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE", "사용 가능한 주차면이 없습니다."),

    // 500 Internal Server Error
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
