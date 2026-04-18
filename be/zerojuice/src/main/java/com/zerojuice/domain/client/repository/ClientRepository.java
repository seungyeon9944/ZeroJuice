package com.zerojuice.domain.client.repository; // 1. 레포지토리 폴더 경로

import com.zerojuice.domain.client.entity.Client; // 2. User 엔티티가 위치한 경로 import
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {
    Optional<Client> findByUserId(String userId);

    boolean existsByUserId(String userId);
}