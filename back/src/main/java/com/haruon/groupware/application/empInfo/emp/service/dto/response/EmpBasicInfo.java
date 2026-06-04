package com.haruon.groupware.application.empInfo.emp.service.dto.response;

import org.jspecify.annotations.Nullable;

public record EmpBasicInfo(
        String empNo,
        String name,
        String loginId,
        String email,
        @Nullable String extensionNo
) {
}
