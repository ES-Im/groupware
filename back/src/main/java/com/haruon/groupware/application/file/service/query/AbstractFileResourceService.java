package com.haruon.groupware.application.file.service.query;

import com.haruon.groupware.application.exception.file.UnsupportedMimeTypeException;
import com.haruon.groupware.application.file.provided.forRetriever.FileResourceRetriever;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.service.query.dto.FileDisposition;
import com.haruon.groupware.application.file.service.query.dto.FileResourceInfo;
import com.haruon.groupware.application.file.service.query.dto.FileResourceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@RequiredArgsConstructor
@Transactional(readOnly = true)
public abstract class AbstractFileResourceService implements FileResourceRetriever {

    protected final FileResourceQueryRepository fileResourceQueryRepository;
    private final FileStorage fileStorage;

    protected Set<String> PREVIEW_RESOURCE_MIME_TYPE = Set.of(
            "image/png",
            "image/jpeg",
            "image/gif",
            "application/pdf"
    );

    protected abstract FileResourceInfo getFileResourceInfo(Long domainPkId, Long fileId);

    @Override
    public FileResourceResponse preview(Long pkId, Long fileId) {
        FileResourceInfo fileInfo = getFileResourceInfo(pkId, fileId);

        if (!PREVIEW_RESOURCE_MIME_TYPE.contains(fileInfo.mimeType())) throw new UnsupportedMimeTypeException();

        Resource resource = fileStorage.loadAsResource(fileInfo.storedPath(), fileInfo.storedName());

        return new FileResourceResponse(
                resource,
                fileInfo.originalName(),
                fileInfo.mimeType(),
                fileInfo.fileSize(),
                FileDisposition.INLINE
        );
    }

    @Override
    public FileResourceResponse download(Long draftId, Long fileId) {
        FileResourceInfo fileInfo = getFileResourceInfo(draftId, fileId);

        Resource resource = fileStorage.loadAsResource(fileInfo.storedPath(), fileInfo.storedName());

        return new FileResourceResponse(
                resource,
                fileInfo.originalName(),
                fileInfo.mimeType(),
                fileInfo.fileSize(),
                FileDisposition.ATTACHMENT
        );
    }

}
