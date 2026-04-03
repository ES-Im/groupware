package com.haruon.groupware.application.empInfo.empService.dto.param;

import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Locale;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record EmpFileReplaceParam(

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
        Long fileSize,

        @NotNull
        FileType fileType
) {

    private static final long FILE_SIZE_MAX = 5 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif");

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif"
    );

    public EmpFileReplaceParam {
        requireNonNull(mimeType, "MIME 타입 필수");
        requireNonNull(originalFileFullName, "원본 파일명 필수");
        requireNonNull(fileSize, "파일 크기 필수");
        requireNonNull(fileType, "파일 타입 지정 필수");

        state(fileSize > 0, "파일 크기는 0보다 커야 함");

        state(ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT)),
                "허용되지 않는 MIME 타입");

        state(fileSize <= FILE_SIZE_MAX, "파일 크기는 5MB를 초과할 수 없음");

        validateExtension();
    }

    public String getExtension() {
        return originalFileFullName.substring(getExtensionStartIndex())
                .toLowerCase(Locale.ROOT);
    }

    public String getOriginalFileName() {
        return originalFileFullName.substring(0, getExtensionStartIndex() - 1);
    }

    private int getExtensionStartIndex() {
        int delimiterIndex = originalFileFullName.lastIndexOf('.');

        state(delimiterIndex > 0 && delimiterIndex < originalFileFullName.length() - 1,
                "유효한 파일 확장자가 없음.");

        return delimiterIndex + 1;
    }

    private void validateExtension() {
        String extension = getExtension();
        state(ALLOWED_EXTENSIONS.contains(extension), "허용되지 않는 파일 확장자");
    }

}
