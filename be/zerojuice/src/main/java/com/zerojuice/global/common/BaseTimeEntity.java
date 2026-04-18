package com.zerojuice.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 공통 Audit 필드를 위한 Base Entity
 * 모든 엔터티는 이 클래스를 상속받아 생성/수정 시간 및 작성자 정보를 자동 관리
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    @CreatedDate
    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @LastModifiedDate
    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @CreatedBy
    @Column(name = "creator", columnDefinition = "char(10)")
    private String creator;

    @LastModifiedBy
    @Column(name = "updater", columnDefinition = "char(10)")
    protected String updater;

    /**
     * Python 서버 등 외부에서 데이터 생성 시 creator 수동 설정
     */
    public void setCreator(String creator) {
        this.creator = creator;
    }

    public void setUpdater(String updater) {
        this.updater = updater;
    }
}
