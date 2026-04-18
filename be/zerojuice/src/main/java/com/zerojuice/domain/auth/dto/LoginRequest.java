package com.zerojuice.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 로그인 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "사용자 로그인 요청")
public class LoginRequest {

    @Schema(description = "휴대폰번호 (예: 01012345678) - 기존 user_id 대체", example = "01012345678", required = true)
    @NotBlank(message = "휴대폰번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]{8,9}$", message = "올바른 휴대폰번호 형식이 아닙니다.")
    private String mobile;

    @Schema(description = "비밀번호", example = "password123", required = true)
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 4, max = 20, message = "비밀번호는 4~20자여야 합니다.")
    private String password;

    @Schema(description = "FCM 푸시 토큰 (선택)", example = "dGVzdF90b2tlbl9mb3JfcHVzaA==")
    private String fcmToken;
}
