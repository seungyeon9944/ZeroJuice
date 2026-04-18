package com.zerojuice.domain.auth.controller;

import com.zerojuice.domain.auth.dto.LoginRequest;
import com.zerojuice.domain.auth.dto.LoginResponse;
import com.zerojuice.domain.auth.dto.SignupRequest;
import com.zerojuice.domain.auth.dto.SignupResponse;
import com.zerojuice.domain.auth.service.UserAuthService;
import com.zerojuice.domain.notification.service.FCMService;
import com.zerojuice.global.common.ApiResponse;
import com.zerojuice.global.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 사용자 인증 컨트롤러
 */
@Slf4j
@Tag(name = "App Auth", description = "앱 사용자 인증 API")
@RestController
@RequestMapping("/auth/user")
@RequiredArgsConstructor
public class UserAuthController {

    private final UserAuthService userAuthService;
    private final JwtTokenProvider jwtTokenProvider;
    private final FCMService fcmService;

    /**
     * 사용자 회원가입
     */
    @Operation(summary = "회원가입", description = "휴대폰번호, 비밀번호, 차량번호로 회원가입합니다.")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>> signup(
            @Valid @RequestBody SignupRequest request) {

        SignupResponse response = userAuthService.signup(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 사용자 로그인
     */
    @Operation(summary = "로그인", description = "휴대폰번호, 비밀번호로 로그인합니다. FCM 토큰은 선택입니다.")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = userAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 사용자 소셜 로그인 (카카오)
     */
    @Operation(summary = "소셜 로그인", description = "카카오 액세스 토큰으로 로그인 또는 회원가입을 진행합니다.")
    @PostMapping("/social-login")
    public ResponseEntity<ApiResponse<LoginResponse>> socialLogin(
            @Valid @RequestBody com.zerojuice.domain.auth.dto.SocialLoginRequest request) {

        LoginResponse response = userAuthService.socialLogin(request.getProvider(), request.getToken(),
                request.getFcmToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 사용자 로그아웃
     */
    @Operation(summary = "로그아웃", description = "FCM 토큰을 초기화하여 푸시 알림을 비활성화합니다.", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        // Authorization 헤더에서 토큰 추출
        String token = extractToken(request);
        Integer userId = Integer.parseInt(jwtTokenProvider.getUserId(token));

        userAuthService.logout(userId, token);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * FCM 토큰 갱신
     */
    @Operation(summary = "FCM 토큰 갱신", description = "로그인 후 토큰이 변경되었을 때 호출합니다.", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/fcm")
    public ResponseEntity<ApiResponse<Void>> updateFcmToken(
            @RequestBody java.util.Map<String, String> requestBody,
            HttpServletRequest request) {

        String token = extractToken(request);
        Integer userId = Integer.parseInt(jwtTokenProvider.getUserId(token));
        String fcmToken = requestBody.get("token");

        userAuthService.updateFcmToken(userId, fcmToken);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 내 정보 조회 (새로고침)
     */
    @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 최신 정보(차량 포함)를 조회합니다.", security = @SecurityRequirement(name = "bearerAuth"))
    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyProfile(HttpServletRequest request) {
        String token = extractToken(request);
        Integer userId = Integer.parseInt(jwtTokenProvider.getUserId(token));

        LoginResponse response = userAuthService.getMyProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 테스트 알림 발송 (Self)
     */
    @Operation(summary = "테스트 알림 발송", description = "자신에게 테스트 푸시 알림을 보냅니다.")
    @PostMapping("/test-push")
    public ResponseEntity<ApiResponse<Void>> sendTestPush(HttpServletRequest request) {
        String token = extractToken(request);
        Integer userId = Integer.parseInt(jwtTokenProvider.getUserId(token));

        fcmService.sendNotificationToUser(userId, "테스트 알림", "이것은 테스트 알림입니다. 🚗");

        return ResponseEntity.ok(ApiResponse.success());
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null; // 예외 처리를 추가하거나 null 반환 후 호출부에서 처리 필요
    }
}
