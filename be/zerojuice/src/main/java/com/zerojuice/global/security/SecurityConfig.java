package com.zerojuice.global.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

import java.util.List;

/**
 * Spring Security 설정
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOriginPatterns(List.of(
                                "http://localhost:3000", // 리액트 개발서버
                                "http://localhost:5173", // Vite 사용시
                                "https://i14a201.p.ssafy.io" // 배포 도메인
                ));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // CSRF 비활성화 (REST API는 Stateless)
                                .csrf(AbstractHttpConfigurer::disable)

                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // 세션 사용 안함 (JWT 사용)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 요청별 권한 설정
                                .authorizeHttpRequests(auth -> auth
                                                // 주차 시 통신 (일단 프리패스)
                                                .requestMatchers(
                                                                "/parking/**")
                                                .permitAll()
                                                .requestMatchers(
                                                                "/test-redis")
                                                .permitAll()

                                                // Swagger UI 접근 허용
                                                .requestMatchers(
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/api-docs/**",
                                                                "/v3/api-docs/**")
                                                .permitAll()

                                                // 웹 관리자 인증 API 접근 허용
                                                .requestMatchers(
                                                                "/users/login",
                                                                "/users/register")
                                                .permitAll()

                                                // 앱 사용자 인증 API 접근 허용
                                                .requestMatchers(
                                                                "/auth/user/signup",
                                                                "/auth/user/login",
                                                                "/auth/user/social-login", // 소셜 로그인
                                                                "/auth/user/refresh",
                                                                "/auth/user/send-verification",
                                                                "/auth/user/verify-code")
                                                .permitAll()

                                                // 내부 시스템 API (CCTV/임베디드)
                                                .requestMatchers(
                                                                "/parking/entry",
                                                                "/parking/exit",
                                                                "/parking-summary",
                                                                "/parking-slots/status",
                                                                "/parking-slots/queue",
                                                                "/parking-slots/queue-config",
                                                                "/sse/exitlog", // 명시적 허용
                                                                "/sse/**",
                                                                "/payments/**",
                                                                "/health",
                                                                "/api/car/**") // Allow car registration for testing
                                                .permitAll()

                                                // 그 외 모든 요청은 인증 필요
                                                .anyRequest().authenticated())

                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }
}
