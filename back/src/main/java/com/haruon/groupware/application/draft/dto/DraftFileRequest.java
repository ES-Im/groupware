package com.haruon.groupware.application.draft.dto;

public record DraftFileRequest(
        String mimeType,
        String originalName,
        String extension,
        Long fileSize
) {
}
