package com.zerojuice.domain.client.dto; // 1. 패키지 경로 (dto 폴더 위치)

import lombok.Getter; // 2. @Getter를 쓰기 위한 라이브러리 가져오기
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor // 3. 기본 생성자 (Jackson 라이브러리가 JSON을 객체로 바꿀 때 필요)
@AllArgsConstructor // 4. 모든 필드를 파라미터로 받는 생성자 (테스트 코드에서 new LoginRequest(...) 쓸 때 필요)
public class LoginRequest {
    @JsonProperty("user_id")    
    private String userId;
    
    private String password;
}