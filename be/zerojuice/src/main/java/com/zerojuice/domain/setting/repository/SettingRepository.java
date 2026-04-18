package com.zerojuice.domain.setting.repository;

import com.zerojuice.domain.setting.entity.SettingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingRepository extends JpaRepository<SettingEntity, Long> {
    
    // 첫 번째 설정 조회 (일반적으로 설정은 단일 레코드)
    Optional<SettingEntity> findFirstByOrderByIdAsc();
}