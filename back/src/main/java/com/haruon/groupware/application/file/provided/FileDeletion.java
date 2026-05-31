package com.haruon.groupware.application.file.provided;

import com.haruon.groupware.application.file.fileService.forManagement.FileDeleteRequest;

/**
 * 실제 물리 파일 삭제 + DB에 메타데이터를 삭제한다
 */
public interface FileDeletion extends FileManager {

    void deleteStoredResource(FileDeleteRequest request);

}
