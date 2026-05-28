package com.haruon.groupware.application.file.dto.result;

import org.springframework.core.io.Resource;

/**
 * controller로 넘기는 Resource 응답용 DTO
 */
public record FileResourceResponse(
        Resource resource,
        String originalName,
        String mimeType,
        Long fileSize,
        FileDisposition disposition
) {
}
