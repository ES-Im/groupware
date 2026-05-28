package com.haruon.groupware.application.file.dto.request;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.InvalidFileNameException;
import lombok.Builder;

import java.util.Locale;

/**
 * 파일 관련 Application DTO 공통 필드
 */
@Builder
public record FileDto(

        String mimeType,

        String originalFileFullName,

        Long fileSize,

        byte[] bytes

) {
    public FileDto {
        if (mimeType == null || originalFileFullName == null || fileSize == null || bytes == null) {
            throw new RequiredValueMissingException();
        }

        if (bytes.length == 0) {
            throw new PositiveValueRequiredException();
        }

        if(mimeType.isBlank() || originalFileFullName.isBlank()) {
            throw new BlankValueNotAllowedException();
        }

        if(fileSize <= 0) throw new PositiveValueRequiredException();
    }

    public String extension() {
        int dotIndex = originalFileFullName.lastIndexOf('.');

        if(!(dotIndex > 0 && dotIndex < originalFileFullName.length() - 1)) throw new InvalidFileNameException();

        return originalFileFullName.substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }

    public String originalFileName() {
        int dotIndex = originalFileFullName.lastIndexOf('.');

        if(dotIndex <= 0) throw new InvalidFileNameException();

        return originalFileFullName.substring(0, dotIndex);
    }
}