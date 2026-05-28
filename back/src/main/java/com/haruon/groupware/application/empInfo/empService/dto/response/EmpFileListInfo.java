package com.haruon.groupware.application.empInfo.empService.dto.response;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.domain.empInfo.enums.FileType;

/**
 * 목록 조회 응답 DTO
 */
public record EmpFileListInfo(
        FileListInfo file,
        Boolean isActive,
        FileType type
) {
    public EmpFileListInfo(
            Long fileId,
            String originalName,
            String extension,
            Long fileSize,
            Boolean isActive,
            FileType type
    ) {
        this(
                new FileListInfo(fileId, originalName, extension, fileSize),
                isActive,
                type
        );
    }
}
