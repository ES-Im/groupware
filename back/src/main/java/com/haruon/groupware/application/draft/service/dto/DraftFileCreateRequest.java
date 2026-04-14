package com.haruon.groupware.application.draft.service.dto;


import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.application.utils.FileValidator;
import jakarta.validation.Valid;
import lombok.Builder;

import java.util.Set;

import static java.util.Objects.requireNonNull;

@Builder
public record DraftFileCreateRequest(

        Long draftId,

        @Valid
       FileDto file

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

    public DraftFileCreateRequest {
        requireNonNull(draftId, "기안서 ID 필수");
        requireNonNull(file, "파일 정보 필수");

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

}