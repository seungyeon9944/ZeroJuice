package com.zerojuice.domain.car.repository;

import com.zerojuice.domain.car.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * 차량 Repository
 */
@Repository
public interface CarRepository extends JpaRepository<Car, Integer> {

    // 사용자 ID로 차량 조회
    Optional<Car> findByUserId(Integer userId);

    // 차량번호로 조회
    Optional<Car> findByCarNo(String carNo);

    // RFID 태그로 조회
    Optional<Car> findByRfidNo(String rfidNo);

    // 차량번호 중복 확인
    boolean existsByCarNo(String carNo);

    // RFID 중복 확인
    boolean existsByRfidNo(String rfidNo);
}