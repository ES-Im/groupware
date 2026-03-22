package com.haruon.groupware.domain.empInfo.emp;

import lombok.Getter;

@Getter
public enum PositionCode {
    NONE(0),
    INTERN(1),
    STAFF(2),
    SENIOR_STAFF(3),
    ASSISTANT_MANAGER(4),
    MANAGER(5),
    SENIOR_MANAGER(6),
    DIRECTOR(7),
    EXECUTIVE(8);

    private final int level;

    PositionCode(int level) {
        this.level = level;
    }

}
