package com.haruon.groupware.application.employee.account.service.query.dto;

import org.jspecify.annotations.Nullable;

public record EmpBasicInfo(
        String empNo,
        String name,
        String loginId,
        String email,
        @Nullable String extensionNo
) {
}
