package com.zerojuice.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 설정
 * 접속: http://localhost:8080/api/v1/swagger-ui.html
 */
@Configuration
public class SwaggerConfig {

        @Bean
        public OpenAPI openAPI() {
                // JWT 인증 스키마 정의
                SecurityScheme securityScheme = new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization");

                // 전역 보안 요구사항
                SecurityRequirement securityRequirement = new SecurityRequirement()
                                .addList("bearerAuth");

                return new OpenAPI()
                                .info(apiInfo())
                                .servers(List.of(
                                                new Server().url("http://localhost:8081/api/v1")
                                                                .description("Local Server")))
                                .components(new Components()
                                                .addSecuritySchemes("bearerAuth", securityScheme))
                                .addSecurityItem(securityRequirement);
        }

        private Info apiInfo() {
                return new Info()
                                .title("ZeroJuice API")
                                .description("자율주행 주차 관제 시스템 API 문서")
                                .version("v1.0.0")
                                .contact(new Contact()
                                                .name("ZeroJuice Team")
                                                .email("zerojuice@example.com"));
        }
}
