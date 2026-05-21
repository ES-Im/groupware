package com.haruon.groupware.application.empInfo.empService.dto.response;

import com.haruon.groupware.domain.empInfo.enums.FileType;

public record EmpFileInfo(
        Long fileId,
        String originalName,
        String extension,
        FileType type,
        Boolean isActive
) {
}
