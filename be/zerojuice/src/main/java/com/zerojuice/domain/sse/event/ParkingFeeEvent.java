package com.zerojuice.domain.sse.event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // ⭐ builder() 메서드 생성을 위해 추가
public class ParkingFeeEvent {
    private String eventType;
    private Object data; // ⭐ 다양한 데이터를 담기 위해 Object로 설정

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder // ⭐ 내부 클래스용 빌더
    public static class ParkingData { // ⭐ MqttSubGateway에서 찾는 ParkingData 클래스
        private Integer fee;
        private String slotNo;
        private String type;
        private String elapsedTime;
        private String inTime;
        private String status;
        private String carNo;
        private Double x;
        private Double y;
        private Double yaw;
        private String timestamp;
    }
}
