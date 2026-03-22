package com.haruon.groupware.domain.empInfo;

import lombok.Getter;

@Getter
public enum AttendanceStatus {
    NORMAL("정상근무"),
    HALF_DAY_LEAVE("반차"),
    ALL_DAY_LEAVE("연차"),
    SICK_LEAVE("병가"),
    ABSENT("결근"),
    LATE_EARLY("지각/조퇴");

    private final  String description;
    AttendanceStatus(String description) {
        this.description = description;
    }
}
