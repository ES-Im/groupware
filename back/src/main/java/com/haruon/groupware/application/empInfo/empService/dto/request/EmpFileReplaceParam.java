package com.haruon.groupware.application.empInfo.empService.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.application.utils.FileValidator;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.Builder;

import java.util.Set;

@Builder
public record EmpFileReplaceParam(

        FileDto file,

        FileType fileType
) {
    private static final long FILE_SIZE_MAX = 5 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );

    public EmpFileReplaceParam {
        if(fileType == null || file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

}