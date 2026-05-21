package com.haruon.groupware.application.empInfo.empService.dto.response;

public record EmpBasicInfo(
        String empNo,
        String name,
        String loginId,
        String email,
        String extensionNo
) {
}
