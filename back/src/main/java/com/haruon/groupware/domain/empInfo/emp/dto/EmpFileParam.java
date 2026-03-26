package com.haruon.groupware.domain.empInfo.emp.dto;

import com.haruon.groupware.domain.empInfo.emp.enums.FileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Locale;
import java.util.Set;

import static org.springframework.util.Assert.state;

@Builder
public record EmpFileParam(

        @Size(max = 100)
        String mimeType,

        @NotBlank
        @Size(max = 200)
        String originalName,

        @Size(max = 10)
        String extension,

        @NotBlank
        @Positive
        Long fileSize,

        FileType fileType
) {
    static final Long fileSizeMax = (long) (5 * 1024 * 1024);
    static final Set<String> allowedExtension = Set.of("jpg", "jpeg", "png", "gif");
    static final Set<String> allowedMimeType = Set.of("image/jpg", "image/jpeg", "image/png", "image/gif");

    public EmpFileParam {
        state(allowedExtension.contains(extension.toLowerCase(Locale.getDefault())),
                "허용되지 않는 파일 확장자");

        state(allowedMimeType.contains(mimeType.toLowerCase(Locale.getDefault())),
                "허용되지 않는 MIME 타입");

        state(fileSize <= fileSizeMax, "파일 크기는 5MB를 초과");

    }
}
