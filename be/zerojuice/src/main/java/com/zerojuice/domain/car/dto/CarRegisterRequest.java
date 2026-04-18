package com.zerojuice.domain.car.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CarRegisterRequest {
    private String carNo;
    private String rfidNo;
}
