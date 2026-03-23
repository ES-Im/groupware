package com.haruon.groupware.domain.empInfo.emp.dto;

import com.haruon.groupware.domain.empInfo.emp.FileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Set;

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

        if(allowedExtension.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("허용되지 않는 파일 확장자입니다. 허용된 확장자: " + allowedExtension);
        }

        if(allowedMimeType.contains(mimeType.toLowerCase())) {
            throw new IllegalArgumentException("허용되지 않는 MIME 타입입니다. 허용된 MIME 타입: " + allowedMimeType);
        }

        if(fileSize > fileSizeMax) { // 5MB
            throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
        }

    }
}
