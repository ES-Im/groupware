package com.haruon.groupware.application.file.required;

import com.haruon.groupware.application.file.service.command.dto.FileDto;
import com.haruon.groupware.application.file.service.command.dto.StoreFile;
import org.springframework.core.io.Resource;


public interface FileStorage {
    StoreFile store(FileDto fileDto, String fileType);

    Resource loadAsResource(String storedPath, String storedName);

    void delete(String storedPath, String storedName);
}