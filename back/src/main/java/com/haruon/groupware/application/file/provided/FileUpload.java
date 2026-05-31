package com.haruon.groupware.application.file.provided;

import com.haruon.groupware.application.file.dto.request.FileUploadRequest;

public interface FileUpload <T extends FileUploadRequest> extends FileManager {
    void uploadResource(T uploadRequest);
}
