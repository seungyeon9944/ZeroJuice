package com.zerojuice.domain.parking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 출차 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponseDto {

    private Integer historyId; // 주차 기록 ID
    private String carNo; // 차량 번호

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime inTime; // 입차 시간

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime outTime; // 출차 시간
    private Integer parkingMinutes; // 주차 시간 (분)
    private Integer amount; // 결제 금액
    private Integer paymentId; // 결제 ID
    private String paymentStatus; // 결제 상태 (PENDING, OK, FAIL)
}