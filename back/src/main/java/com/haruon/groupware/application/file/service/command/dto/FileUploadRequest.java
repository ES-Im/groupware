package com.haruon.groupware.application.file.service.command.dto;

import com.haruon.groupware.application.file.service.support.FileDomain;

public interface FileUploadRequest {
    FileDto file();
    FileDomain domain();
}
