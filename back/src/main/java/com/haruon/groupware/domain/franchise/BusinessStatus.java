package com.haruon.groupware.domain.franchise;

import lombok.Getter;

@Getter
public enum BusinessStatus {
    OPEN("정상 영업 중"),
    CLOSED("폐업"),
    PRE_OPEN("가오픈"),
    TEMP_CLOSED("일시 영업 중단"),
    READY_TO_OPEN("영업 준비 상태");

    private final String description;

    BusinessStatus(String description) {
        this.description = description;
    }
}
