package com.haruon.groupware.application.file.provided.forRetriever;

import com.haruon.groupware.application.file.service.query.dto.FileResourceResponse;
import com.haruon.groupware.application.file.service.support.FileDomain;

/**
 * 프론트에서 요청한 파일의 미리보기 / 다운로드 리소스를 반환
 */
public interface FileResourceRetriever {

    FileDomain domain();

    FileResourceResponse preview(Long pkId, Long fileId);

    FileResourceResponse download(Long pkId, Long fileId);

}
