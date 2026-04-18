package com.zerojuice.domain.parking.service;

import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import com.zerojuice.domain.parking.dto.CheckoutRequestDto;
import com.zerojuice.domain.parking.dto.CheckoutResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ParkingHistoryService {

        /**
         * 전체 조회 (페이징)
         */
        Page<ParkingHistoryResponseDto> getAllParkingHistories(Pageable pageable);

        /**
         * 차량번호로 검색
         */
        Page<ParkingHistoryResponseDto> searchByCarNo(String carNo, Pageable pageable);

        /**
         * 날짜 범위로 검색
         */
        Page<ParkingHistoryResponseDto> searchByDateRange(
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        Pageable pageable);

        /**
         * 통합 검색 (차량번호 + 날짜 범위)
         */
        Page<ParkingHistoryResponseDto> search(
                        String carNo,
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        Pageable pageable);

        /**
         * 출차 처리
         * - out_time 업데이트
         * - 요금 계산
         * - 결제 정보 생성
         */
        CheckoutResponseDto checkout(Integer historyId, CheckoutRequestDto requestDto);

        /**
         * 차량 ID로 출차 처리 (현재 주차 중인 기록 검색 후 처리)
         */
        CheckoutResponseDto checkoutByCarId(Integer carId, CheckoutRequestDto requestDto);

        /**
         * 목데이터 처리: 이미 out_time이 있지만 결제가 안 된 이력들을 일괄 처리
         */
        List<CheckoutResponseDto> processUnpaidHistories(String creator);
}