package com.zerojuice.domain.user.entity;

import com.zerojuice.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 앱 사용자 엔터티
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "mobile", length = 13, nullable = false, unique = true) // 50 -> 20
    private String mobile;

    @Column(name = "password", length = 100, nullable = false) // BCrypt 해시 저장을 위해 넉넉하게 설정
    private String password;

    @Column(name = "fcm_token", columnDefinition = "char(255)", nullable = false)
    private String fcmToken;

    @Column(name = "provider", length = 20)
    private String provider; // PHONE, KAKAO, GOOGLE

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "creator", columnDefinition = "CHAR(10)")
    private String creator;

    @Column(name = "updater", columnDefinition = "CHAR(10)")
    private String updater;

    // FCM 토큰 업데이트
    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    // 비밀번호 변경
    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    // 생성자/수정자 정보를 수동으로 설정해야 할 경우를 위한 메서드 (필요 시)
    public void setAuditInfo(String creator, String updater) {
        this.creator = creator;
        this.updater = updater;
    }
}
