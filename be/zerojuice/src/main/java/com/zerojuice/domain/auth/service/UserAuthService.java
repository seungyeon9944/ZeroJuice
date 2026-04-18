package com.zerojuice.domain.auth.service;

import com.zerojuice.domain.auth.dto.LoginRequest;
import com.zerojuice.domain.auth.dto.LoginResponse;
import com.zerojuice.domain.auth.dto.SignupRequest;
import com.zerojuice.domain.auth.dto.SignupResponse;
import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.domain.car.repository.CarRepository;
import com.zerojuice.domain.user.entity.User;
import com.zerojuice.domain.user.repository.UserRepository;
import com.zerojuice.global.common.ErrorCode;
import com.zerojuice.global.exception.CustomException;
import com.zerojuice.global.security.JwtTokenProvider;
import com.zerojuice.infra.RedisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 사용자 인증 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserAuthService {

        private final UserRepository userRepository;
        private final CarRepository carRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtTokenProvider;
        private final RedisService redisService;

        /**
         * 사용자 회원가입
         * User + Car 동시 생성 후 JWT 토큰 발급
         */
        @Transactional
        public SignupResponse signup(SignupRequest request) {
                // 1. 휴대폰번호 중복 체크
                if (userRepository.existsByMobile(request.getMobile())) {
                        throw new CustomException(ErrorCode.DUPLICATE_MOBILE);
                }

                // 2. 차량번호 중복 체크
                if (carRepository.existsByCarNo(request.getCarNo())) {
                        throw new CustomException(ErrorCode.DUPLICATE_CAR_NO);
                }

                // 3. 비밀번호 암호화 및 User 생성
                User user = User.builder()
                                .mobile(request.getMobile())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .fcmToken("") // 초기값 빈 문자열 (NOT NULL 제약)
                                .build();

                User savedUser = userRepository.save(user);

                // 4. Car 생성 (User와 연결)
                Car car = Car.builder()
                                .user(savedUser)
                                .carNo(request.getCarNo())
                                .build();

                Car savedCar = carRepository.save(car);

                // 5. JWT 토큰 발급
                String accessToken = jwtTokenProvider.createAccessToken(
                                String.valueOf(savedUser.getId()),
                                "USER",
                                savedUser.getMobile());
                String refreshToken = jwtTokenProvider.createRefreshToken(
                                String.valueOf(savedUser.getId()),
                                "USER");

                // 6. 응답 반환
                return SignupResponse.of(
                                accessToken,
                                refreshToken,
                                savedUser.getId(),
                                savedCar.getCarNo());
        }

        /**
         * 사용자 로그인
         * 휴대폰번호 + 비밀번호 검증 후 JWT 토큰 발급
         */
        @Transactional
        public LoginResponse login(LoginRequest request) {
                // 1. 휴대폰번호로 사용자 조회
                log.info("Attempting login for mobile: {}", request.getMobile());
                User user = userRepository.findByMobile(request.getMobile())
                                .orElseThrow(() -> {
                                        log.error("Login failed: User not found for mobile {}", request.getMobile());
                                        return new CustomException(ErrorCode.INVALID_CREDENTIALS);
                                });

                log.info("User found: id={}, mobile={}", user.getId(), user.getMobile());

                // 2. 비밀번호 검증
                if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        log.error("Login failed: Password mismatch for user {}", user.getId());
                        // 디버깅용: 해시 앞부분만 살짝 출력 (보안 주의)
                        log.debug("Stored Hash: {}",
                                        user.getPassword().substring(0, Math.min(10, user.getPassword().length()))
                                                        + "...");
                        throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
                }
                log.info("Password verification successful for user {}", user.getId());

                // 3. FCM 토큰 업데이트 (있는 경우)
                if (request.getFcmToken() != null && !request.getFcmToken().isBlank()) {
                        user.updateFcmToken(request.getFcmToken());
                }

                // 4. 사용자의 차량 정보 조회
                Car car = carRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new CustomException(ErrorCode.CAR_NOT_FOUND));

                // 5. JWT 토큰 발급
                String accessToken = jwtTokenProvider.createAccessToken(
                                String.valueOf(user.getId()),
                                "USER",
                                user.getMobile());
                String refreshToken = jwtTokenProvider.createRefreshToken(
                                String.valueOf(user.getId()),
                                "USER");

                long refreshTokenExpireObj = 7 * 24 * 60 * 60 * 1000L;
                redisService.saveValue("auth:rt:" + user.getId(), refreshToken, refreshTokenExpireObj);

                log.info("User logged in: userId={}, mobile={}", user.getId(), user.getMobile());

                // 6. 응답 반환
                return LoginResponse.of(
                                accessToken,
                                refreshToken,
                                user.getId(),
                                car.getCarNo());
        }

        /**
         * 사용자 로그아웃
         * FCM 토큰 초기화 (푸시 알림 비활성화)
         * redis를 통한 리프래쉬 토큰 관리 <- 추후 구현 예정 까먹지 말자 태섭아
         */
        @Transactional
        public void logout(Integer userId, String accessToken) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                // FCM 토큰 초기화
                user.updateFcmToken("");

                redisService.delete("auth:rt:" + userId);
                long remainingTime = jwtTokenProvider.getExpiration(accessToken);
                if (remainingTime > 0) {
                        redisService.saveBlackList("auth:bl:" + accessToken, "logout", remainingTime);
                }

                log.info("User logged out: userId={}", userId);
        }

        /**
         * 소셜 로그인 (카카오)
         */
        @Transactional
        public LoginResponse socialLogin(String provider, String token, String fcmToken) {
                // 1. 토큰 검증 및 사용자 정보 가져오기 (현재는 카카오만 구현)
                String providerId = null;
                if ("KAKAO".equalsIgnoreCase(provider)) {
                        providerId = verifyKakaoToken(token);
                } else {
                        throw new CustomException(ErrorCode.INVALID_INPUT);
                }

                if (providerId == null) {
                        throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
                }

                // 2. 사용자 조회 또는 회원가입
                String finalProviderId = providerId;
                User user = userRepository.findByProviderAndProviderId(provider.toUpperCase(), providerId)
                                .orElseGet(() -> {
                                        // 회원가입 로직
                                        String dummyMobile = "K" + finalProviderId;
                                        // mobile 길이 제한 (13자리) 처리
                                        if (dummyMobile.length() > 13) {
                                                dummyMobile = dummyMobile.substring(0, 13);
                                        }

                                        // 혹시라도 중복되면 랜덤 추가 (간단한 처리)
                                        if (userRepository.existsByMobile(dummyMobile)) {
                                                dummyMobile = "K" + System.currentTimeMillis() % 100000000000L;
                                        }

                                        User newUser = User.builder()
                                                        .mobile(dummyMobile)
                                                        .password(passwordEncoder.encode("SOCIAL_LOGIN")) // 더미 비번
                                                        .fcmToken("")
                                                        .build();

                                        // User 엔터티의 Builder를 사용하여 객체 생성

                                        return userRepository.save(User.builder()
                                                        .mobile(dummyMobile)
                                                        .password(passwordEncoder.encode(
                                                                        "SOCIAL_LOGIN_" + java.util.UUID.randomUUID()))
                                                        .fcmToken("")
                                                        .provider(provider.toUpperCase())
                                                        .providerId(finalProviderId)
                                                        .build());
                                });

                // 3. FCM 토큰 업데이트
                if (fcmToken != null && !fcmToken.isBlank()) {
                        user.updateFcmToken(fcmToken);
                }

                // 4. 차량 정보 조회 (소셜 유저는 차량이 없을 수 있음)
                String carNo = null;
                try {
                        Car car = carRepository.findByUserId(user.getId()).orElse(null);
                        if (car != null) {
                                carNo = car.getCarNo();
                        }
                } catch (Exception e) {
                        log.warn("Car query failed for user {}", user.getId());
                }

                // 5. 토큰 발급
                String accessToken = jwtTokenProvider.createAccessToken(
                                String.valueOf(user.getId()),
                                "USER",
                                user.getMobile());
                String refreshToken = jwtTokenProvider.createRefreshToken(
                                String.valueOf(user.getId()),
                                "USER");

                long refreshTokenExpireObj = 7 * 24 * 60 * 60 * 1000L;
                redisService.saveValue("auth:rt:" + user.getId(), refreshToken, refreshTokenExpireObj);

                return LoginResponse.of(accessToken, refreshToken, user.getId(), carNo);
        }

        private String verifyKakaoToken(String token) {
                try {
                        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                        headers.set("Authorization", "Bearer " + token);
                        headers.set("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

                        org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(
                                        headers);

                        // 카카오 사용자 정보 요청
                        org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>> responseType = new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {
                        };

                        org.springframework.http.ResponseEntity<java.util.Map<String, Object>> response = restTemplate
                                        .exchange(
                                                        "https://kapi.kakao.com/v2/user/me",
                                                        org.springframework.http.HttpMethod.GET,
                                                        entity,
                                                        responseType);

                        java.util.Map<String, Object> body = response.getBody();
                        if (body != null && body.containsKey("id")) {
                                return String.valueOf(body.get("id"));
                        }
                } catch (Exception e) {
                        log.error("Kakao token verification failed: {}", e.getMessage());
                }
                return null;
        }

        /**
         * FCM 토큰 갱신
         */
        @Transactional
        public void updateFcmToken(Integer userId, String token) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                user.updateFcmToken(token);
        }

        /**
         * 내 정보 조회 (새로고침용)
         */
        @Transactional(readOnly = true)
        public LoginResponse getMyProfile(Integer userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                // 차량 정보 조회
                String carNo = null;
                try {
                        Car car = carRepository.findByUserId(user.getId()).orElse(null);
                        if (car != null) {
                                carNo = car.getCarNo();
                        }
                } catch (Exception e) {
                        log.warn("Car query failed for user {}", user.getId());
                }

                // 토큰은 재발급하지 않고 null 처리하거나, 필요하다면 재발급
                // 여기서는 정보만 갱신하므로 null로 보내도 되지만, DTO 구조상 null 채움
                return LoginResponse.of(null, null, user.getId(), carNo);
        }
}
