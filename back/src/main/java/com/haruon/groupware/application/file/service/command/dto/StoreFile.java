package com.haruon.groupware.application.file.service.command.dto;

public record StoreFile(
        String originalName,
        String storedName,
        String mimeType,
        String extension,
        Long fileSize,
        String storedPath
) {
}
