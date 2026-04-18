package com.zerojuice.domain.client.service;

import com.zerojuice.domain.client.dto.LoginRequest;
import com.zerojuice.domain.client.entity.Client;
import com.zerojuice.domain.client.repository.ClientRepository;
import com.zerojuice.domain.sse.event.ParkingFeeEvent;
import com.zerojuice.infra.sse.AppEventSseHub;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AppEventSseHub sseHub;

    // 로그인 검증
    public Optional<Client> login(LoginRequest request) {
        Optional<Client> client = clientRepository.findByUserId(request.getUserId())
                .filter(user -> user.getPassword().equals(request.getPassword()));


        // ⭐ 로그인 성공 시 SSE로 앱에 완료 신호를 보냅니다.
        client.ifPresent(c -> {
            ParkingFeeEvent loginEvent = ParkingFeeEvent.builder()
                    .eventType("LOGIN_COMPLETE") // ⭐ 이벤트 타입 정의
                    .data(ParkingFeeEvent.ParkingData.builder() // 기존 구조 활용 (필요시 전용 DTO 생성 가능)
                            .type("SUCCESS")
                            .build())
                    .build();

            // Client의 고유 PK(id)가 Long 타입이라고 가정하고 전송합니다.
            // 만약 id 필드명이 다르다면 엔티티 구조에 맞춰 수정하세요.
            sseHub.sendMessage(c.getId().longValue(), loginEvent);
        });

        return client;
    }
    // userId로 Client 조회
    public Optional<Client> getUserById(String userId) {
        return clientRepository.findByUserId(userId);
    }
}
