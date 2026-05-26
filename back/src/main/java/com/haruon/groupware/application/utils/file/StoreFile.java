package com.haruon.groupware.application.utils.file;

public record StoreFile(
        String originalName,
        String storedName,
        String mimeType,
        String extension,
        Long fileSize,
        String storedPath
) {
}
