package com.zerojuice.service;

import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import com.zerojuice.domain.parking.service.ParkingHistoryService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ParkingHistoryServiceTest {

    @Autowired
    private ParkingHistoryService parkingHistoryService;

    @Test
    @DisplayName("전체 주차 이력 조회 - DTO 변환 확인")
    void getAllParkingHistories() {
        // given
        Pageable pageable = PageRequest.of(0, 20, Sort.by("inTime").descending());

        // when
        Page<ParkingHistoryResponseDto> result = parkingHistoryService.getAllParkingHistories(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();
        
        ParkingHistoryResponseDto first = result.getContent().get(0);
        assertThat(first.getId()).isNotNull();
        assertThat(first.getCarNo()).isNotNull();
        assertThat(first.getCarId()).isNotNull();
        assertThat(first.getInTime()).isNotNull();
        
        System.out.println("=== 전체 조회 결과 ===");
        System.out.println("총 데이터: " + result.getTotalElements());
        System.out.println("첫 번째 데이터: " + first.getCarNo() + " / " + first.getInTime());
    }

    @Test
    @DisplayName("차량번호 검색 - DTO 변환 확인")
    void searchByCarNo() {
        // given
        String carNo = "123가";
        Pageable pageable = PageRequest.of(0, 20, Sort.by("inTime").descending());

        // when
        Page<ParkingHistoryResponseDto> result = parkingHistoryService.searchByCarNo(carNo, pageable);

        // then
        assertThat(result).isNotNull();
        
        System.out.println("=== 차량번호 검색 결과 ===");
        System.out.println("검색어: " + carNo);
        System.out.println("검색 결과 수: " + result.getTotalElements());
        
        result.getContent().forEach(dto -> {
            assertThat(dto.getCarNo()).contains(carNo);
            System.out.println(dto.getCarNo() + " / " + dto.getInTime());
        });
    }

    @Test
    @DisplayName("날짜 범위 검색 - DTO 변환 확인")
    void searchByDateRange() {
        // given
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 20, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 26, 23, 59);
        Pageable pageable = PageRequest.of(0, 20, Sort.by("inTime").descending());

        // when
        Page<ParkingHistoryResponseDto> result = parkingHistoryService.searchByDateRange(
                startDate, endDate, pageable);

        // then
        assertThat(result).isNotNull();
        
        System.out.println("=== 날짜 범위 검색 결과 ===");
        System.out.println("기간: " + startDate + " ~ " + endDate);
        System.out.println("검색 결과 수: " + result.getTotalElements());
        
        result.getContent().forEach(dto -> {
            assertThat(dto.getInTime()).isAfterOrEqualTo(startDate);
            assertThat(dto.getInTime()).isBeforeOrEqualTo(endDate);
            System.out.println(dto.getCarNo() + " / " + dto.getInTime());
        });
    }

    @Test
    @DisplayName("통합 검색 - 모든 조건")
    void search() {
        // given
        String carNo = "가";
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 31, 23, 59);
        Pageable pageable = PageRequest.of(0, 10, Sort.by("inTime").descending());

        // when
        Page<ParkingHistoryResponseDto> result = parkingHistoryService.search(
                carNo, startDate, endDate, pageable);

        // then
        assertThat(result).isNotNull();
        
        System.out.println("=== 통합 검색 결과 ===");
        System.out.println("차량번호: " + carNo + ", 기간: " + startDate + " ~ " + endDate);
        System.out.println("검색 결과 수: " + result.getTotalElements());
        
        result.getContent().forEach(dto -> {
            assertThat(dto.getCarNo()).contains(carNo);
            System.out.println(dto.getCarNo() + " / " + dto.getInTime());
        });
    }
}