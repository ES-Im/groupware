package com.haruon.groupware.application.file.required;

import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import org.springframework.core.io.Resource;


public interface FileStorage {
    StoreFile store(FileDto fileDto, String fileType);

    Resource loadAsResource(String storedPath, String storedName);
}
