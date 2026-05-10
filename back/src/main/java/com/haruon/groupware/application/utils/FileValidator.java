package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileSizeLimitExceededException;
import com.haruon.groupware.application.exception.file.UnsupportedFileExtensionException;
import com.haruon.groupware.application.exception.file.UnsupportedMimeTypeException;

import java.util.Locale;
import java.util.Set;

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
        if(file == null || allowedExtensions == null || allowedMimeTypes == null)  throw new RequiredValueMissingException();

        if(file.fileSize() <= 0) throw new PositiveValueRequiredException();

        if(!allowedMimeTypes.contains(file.mimeType().toLowerCase(Locale.ROOT))) throw new UnsupportedMimeTypeException();


        if(file.fileSize() > maxFileSize) throw new FileSizeLimitExceededException();

        if(!allowedExtensions.contains(file.extension())) throw new UnsupportedFileExtensionException();
    }
}