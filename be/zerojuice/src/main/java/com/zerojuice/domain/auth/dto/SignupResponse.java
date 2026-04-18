package com.zerojuice.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 사용자 회원가입 응답 DTO
 */
@Getter
@Builder
@AllArgsConstructor
@Schema(description = "사용자 회원가입 응답")
public class SignupResponse {

    @Schema(description = "JWT 액세스 토큰", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "JWT 리프레시 토큰", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "사용자 ID", example = "1")
    private Integer userId;

    @Schema(description = "차량번호", example = "12가3456")
    private String carNo;

    public static SignupResponse of(String accessToken, String refreshToken,
            Integer userId, String carNo) {
        return SignupResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(userId)
                .carNo(carNo)
                .build();
    }
}
