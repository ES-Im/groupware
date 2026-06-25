package com.haruon.groupware.adapter.file;

import com.haruon.groupware.application.file.dto.request.FileDto;
import org.springframework.web.multipart.MultipartFile;

public class MultipartFileConverter {

    public static FileDto from(MultipartFile file) {
        if (file == null) return null;

        return FileDto.builder()
                .mimeType(file.getContentType())
                .originalFileFullName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .resource(file.getResource())
                .build();
    }

}
