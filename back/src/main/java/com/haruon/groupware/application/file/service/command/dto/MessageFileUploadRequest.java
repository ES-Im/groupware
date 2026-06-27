package com.haruon.groupware.application.file.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.service.support.FileDomain;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.Set;

@Builder
public record MessageFileUploadRequest(

        @NotNull Long writerId,
        @NotNull Long messageDraftId,
        @NotNull FileDto file

) implements FileUploadRequest {

    @Override
    public FileDomain domain() {
        return FileDomain.MESSAGE;
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

    public MessageFileUploadRequest {
        if(file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

    public static MessageFileUploadRequest toMessageFileUploadRequest(Long writerId, Long messageDraftId, FileDto file) {
        return new MessageFileUploadRequest(writerId, messageDraftId, file);
    }
}
