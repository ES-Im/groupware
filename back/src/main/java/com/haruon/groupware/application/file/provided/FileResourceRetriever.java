package com.haruon.groupware.application.file.provided;

import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import com.haruon.groupware.application.file.fileService.FileDomain;

/**
 * 프론트에서 요청한 파일의 미리보기 / 다운로드 리소스를 반환
 */
public interface FileResourceRetriever {

    FileDomain domain();

    FileResourceResponse preview(Long pkId, Long fileId);

    FileResourceResponse download(Long pkId, Long fileId);

}
