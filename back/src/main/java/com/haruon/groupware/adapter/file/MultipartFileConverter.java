package com.haruon.groupware.adapter.file;

import com.haruon.groupware.adapter.webapi.exception.auth.FileConvertFailedException;
import com.haruon.groupware.application.utils.file.FileDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public class MultipartFileConverter {

    public static FileDto from(MultipartFile file) {
        if (file == null) return null;

        try {
            return FileDto.builder()
                    .mimeType(file.getContentType())
                    .originalFileFullName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .bytes(file.getBytes())
                    .build();
        } catch (IOException e) {
            throw new FileConvertFailedException();
        }
    }

}
