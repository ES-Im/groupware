package com.haruon.groupware.application.board.service.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.dto.request.FileDto;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record BoardFileRequest(
        FileDto file,
        LocalDateTime modifiedAt
) {

    private static final long FILE_SIZE_MAX = 20 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "png", "jpg", "jpeg", "gif", "zip"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint"
    );

    public BoardFileRequest {
        if(file == null || modifiedAt == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }
}
