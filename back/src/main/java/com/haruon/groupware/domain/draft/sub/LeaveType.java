package com.haruon.groupware.domain.draft.sub;

import lombok.Getter;

@Getter
public enum LeaveType {
    ANNUAL("연차"),
    HOURLY("공휴일"),
    SICK("병가"),
    OFFICIAL("공가"),
    COMPENSATORY("대체휴무"),
    SPECIAL("특별휴가");

    private final String description;

    LeaveType(String description) {
        this.description = description;
    }
}
