package com.zerojuice.domain.car.service;

import com.zerojuice.domain.car.dto.CarRegisterRequest;
import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.domain.car.repository.CarRepository;
import com.zerojuice.domain.user.entity.User;
import com.zerojuice.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final UserRepository userRepository;

    /**
     * 차량 등록 또는 업데이트
     */
    @Transactional
    public void registerOrUpdateCar(Integer userId, CarRegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Car car = carRepository.findByUserId(userId)
                .orElse(null);

        if (car == null) {
            // 신규 등록 시 중복 체크
            if (carRepository.existsByCarNo(request.getCarNo())) {
                throw new RuntimeException("이미 등록된 차량 번호입니다.");
            }

            // 신규 등록
            car = Car.builder()
                    .user(user)
                    .carNo(request.getCarNo())
                    .rfidNo(request.getRfidNo()) // Optional
                    .creator("APP_" + userId)
                    .updater("APP_" + userId)
                    .build();
            carRepository.save(car);
            log.info("차량 신규 등록 완료: User {}, CarNo {}", userId, request.getCarNo());
        } else {
            // 기존 차량 업데이트 시, 번호가 바뀌었으면 중복 체크
            if (!car.getCarNo().equals(request.getCarNo())) {
                if (carRepository.existsByCarNo(request.getCarNo())) {
                    throw new RuntimeException("이미 등록된 차량 번호입니다.");
                }
            }

            car.updateCarNo(request.getCarNo());
            if (request.getRfidNo() != null && !request.getRfidNo().isEmpty()) {
                car.updateRfidNo(request.getRfidNo());
            }
            log.info("차량 정보 수정 완료: User {}, CarNo {}", userId, request.getCarNo());
        }
    }

    /**
     * 차량 삭제
     */
    @Transactional
    public void deleteCar(Integer userId, String carNo) {
        Car car = carRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("등록된 차량이 없습니다."));

        if (!car.getCarNo().equals(carNo)) {
            throw new RuntimeException("해당 차량의 소유주가 아닙니다.");
        }

        carRepository.delete(car);
        log.info("차량 삭제 완료: User {}, CarNo {}", userId, carNo);
    }
}
