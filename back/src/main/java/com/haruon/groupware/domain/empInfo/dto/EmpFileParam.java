package com.haruon.groupware.domain.empInfo.dto;

import com.haruon.groupware.domain.FileParam;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.Builder;

import java.util.Locale;
import java.util.Set;

import static org.springframework.util.Assert.state;

@Builder
public record EmpFileParam(
        FileParam fileParam,
        FileType fileType
) {
    static final Long fileSizeMax = (long) (5 * 1024 * 1024);
    static final Set<String> allowedExtension = Set.of("jpg", "jpeg", "png", "gif");
    static final Set<String> allowedMimeType = Set.of("image/jpg", "image/jpeg", "image/png", "image/gif");

    public EmpFileParam {
        state(allowedExtension.contains(fileParam.extension().toLowerCase(Locale.getDefault())),
                "허용되지 않는 파일 확장자");

        state(allowedMimeType.contains(fileParam.mimeType().toLowerCase(Locale.getDefault())),
                "허용되지 않는 MIME 타입");

        state(fileParam.fileSize() <= fileSizeMax, "파일 크기는 5MB를 초과");

    }
}
