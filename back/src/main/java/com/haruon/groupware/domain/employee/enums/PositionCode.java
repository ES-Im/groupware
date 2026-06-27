package com.haruon.groupware.domain.employee.enums;

import lombok.Getter;

@Getter
public enum PositionCode {
    NONE("미지정", 0),
    INTERN("인턴", 1),
    STAFF("사원", 2),
    SENIOR_STAFF("주임", 3),
    ASSISTANT_MANAGER("대리", 4),
    MANAGER("과장", 5),
    SENIOR_MANAGER("차장", 6),
    DIRECTOR("부장", 7),
    EXECUTIVE("임원", 8);

    private final String description;
    private final int level;

    PositionCode(String description, int level) {
        this.description = description;
        this.level = level;
    }

}
