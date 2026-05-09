package com.haruon.groupware.application.utils;

import java.util.Locale;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/**
 * Application DTO 공통 파일 validation
 */
public final class FileValidator {

    private FileValidator() {
    }

    public static void validate(
            FileDto file,
            Set<String> allowedExtensions,
            Set<String> allowedMimeTypes,
            long maxFileSize
    ) {
        requireNonNull(file, "파일 정보 필수");
        requireNonNull(allowedExtensions, "허용 확장자 정보 필수");
        requireNonNull(allowedMimeTypes, "허용 MIME 타입 정보 필수");

        state(file.fileSize() > 0, "파일 크기는 0보다 커야 함");

        state(allowedMimeTypes.contains(file.mimeType().toLowerCase(Locale.ROOT)),
                "허용되지 않는 MIME 타입");

        state(file.fileSize() <= maxFileSize,
                "파일 크기 제한 초과");

        state(allowedExtensions.contains(file.extension()),
                "허용되지 않는 파일 확장자");
    }
}