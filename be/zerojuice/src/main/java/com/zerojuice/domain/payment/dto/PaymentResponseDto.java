package com.zerojuice.domain.payment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.zerojuice.domain.payment.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 결제 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDto {

    private Integer id;
    private Integer transactionId;
    private Integer amount;
    private String method;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime paidAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime updateTime;
    private String creator;
    private String updater;

    // Entity -> DTO 변환
    public static PaymentResponseDto from(Payment entity) {
        return PaymentResponseDto.builder()
                .id(entity.getId())
                .transactionId(entity.getHistory().getId())
                .amount(entity.getAmount())
                .method(entity.getMethod().name())
                .status(entity.getStatus().name())
                .paidAt(entity.getPayTime())
                .createTime(entity.getCreateTime())
                .updateTime(entity.getUpdateTime())
                .creator(entity.getCreator())
                .updater(entity.getUpdater())
                .build();
    }
}