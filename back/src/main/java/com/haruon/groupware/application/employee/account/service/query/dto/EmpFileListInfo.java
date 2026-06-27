package com.haruon.groupware.application.employee.account.service.query.dto;

import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.domain.employee.enums.FileType;

import static com.haruon.groupware.application.file.service.query.dto.FileListInfo.toFileListInfo;

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
                toFileListInfo(fileId, originalName, extension, fileSize),
                isActive,
                type
        );
    }
}
