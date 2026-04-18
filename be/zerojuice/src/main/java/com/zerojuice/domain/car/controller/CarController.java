package com.zerojuice.domain.car.controller;

import com.zerojuice.domain.car.dto.CarRegisterRequest;
import com.zerojuice.domain.car.service.CarService;
import com.zerojuice.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/car")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    /**
     * 차량 등록 및 수정
     * POST /api/car?userId=...
     */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> registerCar(
            @RequestParam Integer userId,
            @RequestBody CarRegisterRequest request) {

        log.info("차량 등록 요청: User {}, CarNo {}", userId, request.getCarNo());
        carService.registerOrUpdateCar(userId, request);

        return ResponseEntity.ok(ApiResponse.success("차량 등록이 완료되었습니다."));
    }

    /**
     * 차량 삭제
     * DELETE /api/car?userId=...&carNo=...
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> deleteCar(
            @RequestParam Integer userId,
            @RequestParam String carNo) {

        log.info("차량 삭제 요청: User {}, CarNo {}", userId, carNo);
        carService.deleteCar(userId, carNo);

        return ResponseEntity.ok(ApiResponse.success("차량 삭제가 완료되었습니다."));
    }
}
