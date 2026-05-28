package com.haruon.groupware.application.file.dto.result;

public record StoreFile(
        String originalName,
        String storedName,
        String mimeType,
        String extension,
        Long fileSize,
        String storedPath
) {
}
