package com.zerojuice.domain.parking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.zerojuice.domain.parking.entity.ParkingHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingHistoryResponseDto {

    private Integer id;
    private String carNo;
    private Integer carId;
    private Byte slotNo;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime inTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime outTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime updateTime;

    private String creator;
    private String updater;

    public static ParkingHistoryResponseDto from(ParkingHistory parkingHistory) {
        return ParkingHistoryResponseDto.builder()
                .id(parkingHistory.getId())
                .carNo(parkingHistory.getCar().getCarNo())
                .carId(parkingHistory.getCar().getId())
                .slotNo(parkingHistory.getSlotNo())
                .inTime(parkingHistory.getInTime())
                .outTime(parkingHistory.getOutTime())
                .createTime(parkingHistory.getCreateTime())
                .updateTime(parkingHistory.getUpdateTime())
                .creator(parkingHistory.getCreator())
                .updater(parkingHistory.getUpdater())
                .build();
    }
}