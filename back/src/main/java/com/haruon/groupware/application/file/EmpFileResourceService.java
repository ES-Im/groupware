package com.haruon.groupware.application.file;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.exception.file.UnsupportedMimeTypeException;
import com.haruon.groupware.application.file.dto.result.FileDisposition;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmpFileResourceService {

    private final FileResourceQueryRepository fileResourceQueryRepository;
    private final FileStorage fileStorage;

    private static final Set<String> PREVIEW_RESOURCE_MIME_TYPE = Set.of(
            "image/png",
            "image/jpeg",
            "image/gif",
            "application/pdf"
    );

    public FileResourceResponse preview(Long domainPkId, Long fileId, FileDomain domainType) {
        FileResourceInfo fileResourceInfo = getFileResourceInfo(domainPkId, fileId, domainType);

        return preview(fileResourceInfo);
    }

    public FileResourceResponse download(Long empId, Long fileId, FileDomain domainType) {
        FileResourceInfo fileResourceInfo = getFileResourceInfo(empId, fileId, domainType);

        return download(fileResourceInfo);
    }

    private FileResourceInfo getFileResourceInfo(Long domainPkId, Long fileId, FileDomain domain) {
        return switch (domain) {
            case EMP -> fileResourceQueryRepository
                    .findEmpFileInfoByEmpIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
            case BOARD -> fileResourceQueryRepository
                    .findBoardFileInfoByBoardIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
            case DRAFT -> fileResourceQueryRepository
                    .findDraftFileInfoByDraftIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
            case MESSAGE -> fileResourceQueryRepository
                    .findMessageFileInfoByMessageIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
            case EDUCATION -> fileResourceQueryRepository
                    .findEducationFileInfoByEducationIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
            case MEETING_ROOM -> fileResourceQueryRepository
                    .findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(domainPkId, fileId)
                    .orElseThrow(FileNotFoundException::new);
        };
    }

    private FileResourceResponse preview(FileResourceInfo fileInfo) {
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

    private FileResourceResponse download(FileResourceInfo fileInfo) {
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
