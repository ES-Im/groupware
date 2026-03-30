package com.haruon.groupware.domain.empInfo.enums;

import lombok.Getter;

@Getter
public enum SystemRoleCode {
    EMPLOYEE(1, false),        // 일반권한
    DEPT_MANAGER(2, false),    // 부서 관리자 권한
    ADMIN(3, false),           // 시스템 총괄 권한

    FRANCHISE(0, true),        // 프랜차이즈 관리 권한
    IT(0, true),               // 시스템 부서 권한
    HR(0, true);               // 인사과 권한

    private final int grade;
    private final boolean isDeptType;

    SystemRoleCode(int grade, boolean isDeptType) {
        this.grade = grade;
        this.isDeptType = isDeptType;
    }
}
