package com.haruon.groupware.application.empInfo.empService.dto.response;

import org.jspecify.annotations.Nullable;

public record EmpBasicInfo(
        String empNo,
        String name,
        String loginId,
        String email,
        @Nullable String extensionNo
) {
}
