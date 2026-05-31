package com.haruon.groupware.application.file.dto.request;

import com.haruon.groupware.application.file.fileService.FileDomain;

public interface FileUploadRequest {
    FileDto file();
    FileDomain domain();
}
