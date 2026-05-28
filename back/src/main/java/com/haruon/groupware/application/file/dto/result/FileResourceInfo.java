package com.haruon.groupware.application.file.dto.result;

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
