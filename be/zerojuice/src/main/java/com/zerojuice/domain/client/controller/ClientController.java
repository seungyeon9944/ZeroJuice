package com.zerojuice.domain.client.controller;

import com.zerojuice.domain.client.dto.LoginRequest;
import com.zerojuice.domain.client.service.ClientService;
import com.zerojuice.domain.client.entity.Client;
import com.zerojuice.global.security.JwtTokenProvider;
import com.zerojuice.infra.RedisService;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisService redisService;

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        System.out.println("=== 로그인 요청 ===");
        System.out.println("user_id: " + request.getUserId());
        
        Optional<Client> userOpt = userService.login(request);

        if (userOpt.isPresent()) {
            Client user = userOpt.get();

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(
                user.getUserId(),
                user.getClientName()
            );
            String refreshToken = jwtTokenProvider.createRefreshToken(
                user.getUserId()
            );

            System.out.println("✅ 로그인 성공");
            System.out.println("AccessToken: " + accessToken.substring(0, 20) + "...");

            Map<String, String> response = Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "clientName", user.getClientName()
            );

            return ResponseEntity.ok(response);
        }

        System.out.println("❌ 로그인 실패");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 토큰 갱신
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        System.out.println("=== 토큰 갱신 요청 ===");

        // RefreshToken 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            System.out.println("❌ RefreshToken 검증 실패");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 토큰 타입 확인
        String tokenType = jwtTokenProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            System.out.println("❌ AccessToken으로 갱신 시도");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 새 AccessToken 발급
        String userId = jwtTokenProvider.getUserId(refreshToken);
        Optional<Client> userOpt = userService.getUserById(userId);
        
        if (userOpt.isEmpty()) {
            System.out.println("❌ 사용자 없음: " + userId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Client user = userOpt.get();
        String newAccessToken = jwtTokenProvider.createAccessToken(
            user.getUserId(),
            user.getClientName()
        );

        System.out.println("✅ 토큰 갱신 성공: " + userId);

        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    // 로그아웃 (나중에 Redis 추가 시 사용)
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        System.out.println("=== 로그아웃 요청 ===");

        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().build();
        }

        String accessToken = token.substring(7);
        String userId = jwtTokenProvider.getUserId(accessToken);

        // 1. Redis에서 Refresh Token 삭제
        redisService.delete("auth:rt:" + userId);

        // 2. Access Token 블랙리스트 등록 (남은 유효 시간만큼)
        long remainingTime = jwtTokenProvider.getExpiration(accessToken);
        if (remainingTime > 0) {
            redisService.saveBlackList("auth:bl:" + accessToken, "logout", remainingTime);
        }

        //log.info("✅ 로그아웃 성공 (RT 삭제 및 AT 블랙리스트 등록): {}", userId);

        return ResponseEntity.ok().build();
    }
}
