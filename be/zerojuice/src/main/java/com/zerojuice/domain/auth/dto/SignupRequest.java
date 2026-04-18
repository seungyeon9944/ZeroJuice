package com.zerojuice.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 회원가입 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "사용자 회원가입 요청")
public class SignupRequest {

    @Schema(description = "휴대폰번호 (하이픈 없이)", example = "01012345678", required = true)
    @NotBlank(message = "휴대폰번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]{8,9}$", message = "올바른 휴대폰번호 형식이 아닙니다.")
    private String mobile;

    @Schema(description = "비밀번호 (4~20자)", example = "password123", required = true)
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 4, max = 20, message = "비밀번호는 4~20자여야 합니다.")
    private String password;

    @Schema(description = "차량번호 (최대 20자)", example = "12가3456", required = true)
    @NotBlank(message = "차량번호는 필수입니다.")
    @Pattern(regexp = "^([가-힣]{2})?\\d{2,3}[가-힣]\\d{4}$", message = "올바른 차량번호 형식이 아닙니다.")
    private String carNo;
}
