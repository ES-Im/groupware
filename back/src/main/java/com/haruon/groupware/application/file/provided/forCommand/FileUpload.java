package com.haruon.groupware.application.file.provided.forCommand;

import com.haruon.groupware.application.file.service.command.dto.FileUploadRequest;

public interface FileUpload <T extends FileUploadRequest> extends FileManager {
    void uploadResource(T uploadRequest);
}
