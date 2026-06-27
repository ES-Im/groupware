package com.haruon.groupware.application.file.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.service.support.FileDomain;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record BoardFileUploadRequest(

        @NotNull Long requesterId,

        @NotNull Long boardId,

        @NotNull FileDto file,

        @NotNull LocalDateTime modifiedAt

) implements FileUploadRequest {

    @Override
    public FileDomain domain() {
        return FileDomain.BOARD;
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

    public BoardFileUploadRequest {
        if(file == null || modifiedAt == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

    public static BoardFileUploadRequest toBoardFileUploadRequest(Long boardId, Long requesterId, FileDto file, LocalDateTime modifiedAt) {
        return new BoardFileUploadRequest(requesterId, boardId, file, modifiedAt);
    }
}
