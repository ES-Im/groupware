package com.haruon.groupware.application.utils;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Locale;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record FileDto(

        @NotNull
        @NotBlank
        @Size(max = 100)
        String mimeType,

        @NotNull
        @NotBlank
        @Size(max = 200)
        String originalFileFullName,

        @NotNull
        @Positive
        Long fileSize

) {
    public FileDto {
        requireNonNull(mimeType, "MIME 타입 필수");
        requireNonNull(originalFileFullName, "원본 파일명 필수");
        requireNonNull(fileSize, "파일 크기 필수");
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