package com.haruon.groupware.application.utils;

import lombok.Builder;

import java.util.Locale;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/**
 * 파일 관련 Application DTO 공통 필드
 * @param mimeType
 * @param originalFileFullName
 * @param fileSize
 */
@Builder
public record FileDto(

        String mimeType,

        String originalFileFullName,

        Long fileSize

) {
    public FileDto {
        requireNonNull(mimeType, "MIME 타입 필수");
        requireNonNull(originalFileFullName, "원본 파일명 필수");
        requireNonNull(fileSize, "파일 크기 필수");

        state(!mimeType.isBlank(), "mimeType은 공백이 될 수 없음");
        state(!originalFileFullName.isBlank(), "originalFileFullName은 공백이 될 수 없음");
        state(fileSize>0, "파일크기는 양수여야 함");

    }

    public String extension() {
        int dotIndex = originalFileFullName.lastIndexOf('.');

        state(dotIndex > 0 && dotIndex < originalFileFullName.length() - 1,
                "유효한 파일 확장자가 없음");

        return originalFileFullName.substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }

    public String originalFileName() {
        int dotIndex = originalFileFullName.lastIndexOf('.');

        state(dotIndex > 0, "유효한 파일 확장자가 없음");

        return originalFileFullName.substring(0, dotIndex);
    }
}