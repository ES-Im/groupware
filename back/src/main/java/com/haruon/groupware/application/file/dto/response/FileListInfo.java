package com.haruon.groupware.application.file.dto.response;

public record FileListInfo(
        Long fileId,
        String originalName,
        String extension,
        Long fileSize
) {
}
