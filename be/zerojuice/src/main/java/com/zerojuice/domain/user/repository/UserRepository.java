package com.zerojuice.domain.user.repository;

import com.zerojuice.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 Repository
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // 휴대폰번호로 사용자 조회
    Optional<User> findByMobile(String mobile);

    // 휴대폰번호 중복 확인
    boolean existsByMobile(String mobile);

    // 소셜 로그인 사용자 조회
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
