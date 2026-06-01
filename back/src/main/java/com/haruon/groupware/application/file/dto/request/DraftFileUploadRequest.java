package com.haruon.groupware.application.file.dto.request;


import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.fileService.FileDomain;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.Set;

@Builder
public record DraftFileUploadRequest(

        @NotNull Long draftId,

        @NotNull Long drafterId,

        @NotNull FileDto file

) implements FileUploadRequest {

    @Override
    public FileDomain domain() {
        return FileDomain.DRAFT;
    }

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
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv",
            "application/csv",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "application/zip",
            "application/x-zip-compressed"
    );

    public DraftFileUploadRequest {
        if(file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

    public static DraftFileUploadRequest toDraftFileUploadRequest(Long draftId, Long drafterId, FileDto file) {
        return new DraftFileUploadRequest(draftId, drafterId, file);
    }

}
