package com.haruon.groupware.application.file.dto.response;

public record FileListInfo(
        Long fileId,
        String originalName,
        String extension,
        Long fileSize
) {
    public static FileListInfo toFileListInfo(
            Long fileId,
            String originalName,
            String extension,
            Long fileSize
    ) {
        return new FileListInfo(fileId, originalName, extension, fileSize);
    }
}
