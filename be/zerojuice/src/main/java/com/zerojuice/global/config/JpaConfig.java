package com.zerojuice.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing 설정
 * BaseTimeEntity의 @CreatedDate, @LastModifiedDate 등 자동 처리
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
