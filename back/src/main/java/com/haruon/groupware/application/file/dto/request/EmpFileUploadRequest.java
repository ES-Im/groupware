package com.haruon.groupware.application.file.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.Set;

@Builder
public record EmpFileUploadRequest(

        @NotNull Long empId,
        @NotNull FileType fileType,

        @NotNull FileDto file


) implements FileUploadRequest {

    @Override
    public FileDomain domain() {
        return FileDomain.EMP;
    }

    private static final long FILE_SIZE_MAX = 5 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );

    public EmpFileUploadRequest {

        if(fileType == null || file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

}