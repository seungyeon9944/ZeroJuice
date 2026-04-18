package com.zerojuice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zerojuice.domain.parking.dto.ParkingStatusRequestDto;
import com.zerojuice.domain.parking.entity.ParkingSlot;
import com.zerojuice.domain.parking.entity.SlotStatus;
import com.zerojuice.domain.parking.repository.ParkingSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.junit.jupiter.api.TestInstance;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ParkingSlotController 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)  // Security 필터 비활성화
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ParkingSlotControllerTest {

    @TestConfiguration
    static class TestAuditorConfig {
        @Bean
        public AuditorAware<String> auditorProvider() {
            return () -> Optional.of("TEST_USER");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @BeforeEach
    void setUp() {
        // 테스트 전 데이터 초기화
        parkingSlotRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /parking-slots/status - 주차 상태 업데이트 성공")
    void updateParkingStatus_Success() throws Exception {
        // given
        Map<String, String> slots = new HashMap<>();
        slots.put("A1", "empty");
        slots.put("A2", "parking");
        slots.put("B1", "empty");
        slots.put("B2", "parking");
        slots.put("C1", "empty");
        slots.put("C2", "parking");

        ParkingStatusRequestDto requestDto = new ParkingStatusRequestDto(slots);

        // when & then
        mockMvc.perform(post("/parking-slots/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.updatedCount").value(6))
                .andExpect(jsonPath("$.message").value("주차 상태 업데이트 완료"));

        // DB 검증
        assertThat(parkingSlotRepository.count()).isEqualTo(6);
        
        ParkingSlot slot1 = parkingSlotRepository.findBySlotNo((byte) 1).orElseThrow();
        assertThat(slot1.getStatus()).isEqualTo(SlotStatus.EMPTY);
        
        ParkingSlot slot2 = parkingSlotRepository.findBySlotNo((byte) 2).orElseThrow();
        assertThat(slot2.getStatus()).isEqualTo(SlotStatus.PARKING);
    }

    @Test
    @DisplayName("POST /parking-slots/status - 알 수 없는 슬롯 이름 무시")
    void updateParkingStatus_UnknownSlotName() throws Exception {
        // given
        Map<String, String> slots = new HashMap<>();
        slots.put("A1", "empty");
        slots.put("X9", "parking");  // 알 수 없는 슬롯

        ParkingStatusRequestDto requestDto = new ParkingStatusRequestDto(slots);

        // when & then
        mockMvc.perform(post("/parking-slots/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.updatedCount").value(1));  // A1만 업데이트

        // DB 검증
        assertThat(parkingSlotRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("POST /parking-slots/status - 기존 데이터 업데이트")
    void updateParkingStatus_UpdateExisting() throws Exception {
        // given - 기존 데이터 생성
        ParkingSlot existingSlot = ParkingSlot.builder()
                .slotNo((byte) 1)
                .posX(10.0)
                .posY(20.0)
                .status(SlotStatus.EMPTY)
                .build();
        existingSlot.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(existingSlot);

        Map<String, String> slots = new HashMap<>();
        slots.put("A1", "parking");  // EMPTY -> PARKING 변경

        ParkingStatusRequestDto requestDto = new ParkingStatusRequestDto(slots);

        // when & then
        mockMvc.perform(post("/parking-slots/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(1));

        // DB 검증 - 상태가 변경되었는지 확인
        ParkingSlot updatedSlot = parkingSlotRepository.findBySlotNo((byte) 1).orElseThrow();
        assertThat(updatedSlot.getStatus()).isEqualTo(SlotStatus.PARKING);
        assertThat(parkingSlotRepository.count()).isEqualTo(1);  // 새로 생성되지 않고 업데이트만
    }

    @Test
    @DisplayName("GET /parking-slots/status - 전체 주차 상태 조회")
    void getAllParkingStatus() throws Exception {
        // given
        ParkingSlot slot1 = ParkingSlot.builder()
                .slotNo((byte) 1)
                .status(SlotStatus.EMPTY)
                .posX(10.0)
                .posY(20.0)
                .build();
        slot1.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot1);
        
        ParkingSlot slot2 = ParkingSlot.builder()
                .slotNo((byte) 2)
                .status(SlotStatus.PARKING)
                .posX(30.0)
                .posY(20.0)
                .build();
        slot2.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot2);

        // when & then
        mockMvc.perform(get("/parking-slots/status"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.1").value("EMPTY"))
                .andExpect(jsonPath("$.2").value("PARKING"));
    }

    @Test
    @DisplayName("GET /parking-slots/empty-count - 빈 슬롯 개수 조회")
    void getEmptySlotCount() throws Exception {
        // given
        ParkingSlot slot1 = ParkingSlot.builder()
                .slotNo((byte) 1)
                .status(SlotStatus.EMPTY)
                .posX(10.0)
                .posY(20.0)
                .build();
        slot1.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot1);
        
        ParkingSlot slot2 = ParkingSlot.builder()
                .slotNo((byte) 2)
                .status(SlotStatus.EMPTY)
                .posX(30.0)
                .posY(20.0)
                .build();
        slot2.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot2);
        
        ParkingSlot slot3 = ParkingSlot.builder()
                .slotNo((byte) 3)
                .status(SlotStatus.PARKING)
                .posX(50.0)
                .posY(20.0)
                .build();
        slot3.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot3);

        // when & then
        mockMvc.perform(get("/parking-slots/empty-count"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }

    @Test
    @DisplayName("GET /parking-slots/parking-count - 주차 중인 슬롯 개수 조회")
    void getParkingSlotCount() throws Exception {
        // given
        ParkingSlot slot1 = ParkingSlot.builder()
                .slotNo((byte) 1)
                .status(SlotStatus.PARKING)
                .posX(10.0)
                .posY(20.0)
                .build();
        slot1.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot1);
        
        ParkingSlot slot2 = ParkingSlot.builder()
                .slotNo((byte) 2)
                .status(SlotStatus.PARKING)
                .posX(30.0)
                .posY(20.0)
                .build();
        slot2.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot2);
        
        ParkingSlot slot3 = ParkingSlot.builder()
                .slotNo((byte) 3)
                .status(SlotStatus.EMPTY)
                .posX(50.0)
                .posY(20.0)
                .build();
        slot3.setCreatorForPython("TEST_USER");
        parkingSlotRepository.save(slot3);

        // when & then
        mockMvc.perform(get("/parking-slots/parking-count"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }

    @Test
    @DisplayName("POST /parking-slots/status - 빈 요청 처리")
    void updateParkingStatus_EmptyRequest() throws Exception {
        // given
        Map<String, String> slots = new HashMap<>();
        ParkingStatusRequestDto requestDto = new ParkingStatusRequestDto(slots);

        // when & then
        mockMvc.perform(post("/parking-slots/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(0));
    }
}