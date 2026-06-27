package com.haruon.groupware.application.file.service.query.dto;

/**
 * application 내부 Resource 반환용 DTO
 */
public record FileResourceInfo(
        Long fileId,
        String originalName,
        String storedPath,
        String storedName,
        String mimeType,
        String extension,
        Long fileSize
) {
}

