package com.zerojuice.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 소셜 로그인 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "소셜 로그인 요청")
public class SocialLoginRequest {

    @Schema(description = "제공자 (KAKAO, GOOGLE)", example = "KAKAO", required = true)
    @NotBlank(message = "제공자는 필수입니다.")
    private String provider;

    @Schema(description = "액세스 토큰", example = "access_token_from_provider", required = true)
    @NotBlank(message = "토큰은 필수입니다.")
    private String token;

    @Schema(description = "FCM 푸시 토큰 (선택)", example = "dGVzdF90b2tlbl9mb3JfcHVzaA==")
    private String fcmToken;
}
