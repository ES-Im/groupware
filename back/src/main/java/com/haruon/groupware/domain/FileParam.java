package com.haruon.groupware.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record FileParam (
        @NotBlank
        @Size(max = 100)
        String mimeType,

        @NotBlank
        @Size(max = 200)
        String originalName,

        @NotBlank
        @Size(max = 10)
        String extension,

        @NotNull
        @Positive
        Long fileSize
) {
    public FileParam {
        requireNonNull(mimeType, "MIME 타입 필수");
        requireNonNull(originalName, "원본 파일명 필수");
        requireNonNull(extension, "확장자 필수");
        requireNonNull(fileSize, "파일 크기 필수");

        state(fileSize > 0, "파일 크기는 0보다 커야 함");
    }
}