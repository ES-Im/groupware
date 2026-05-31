package com.haruon.groupware.application.file.fileService.forRetriever;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import org.springframework.stereotype.Service;

@Service
public class EducationFileResourceService extends AbstractFileResourceService {

    @Override
    public FileDomain domain() {
        return FileDomain.EDUCATION;
    }

    public EducationFileResourceService(
            FileResourceQueryRepository fileResourceQueryRepository,
            FileStorage fileStorage
    ) {
        super(fileResourceQueryRepository, fileStorage);
    }

    protected FileResourceInfo getFileResourceInfo(Long educationId, Long fileId) {
        return fileResourceQueryRepository
                .findEducationFileInfoByEducationIdAndFileIdForResource(educationId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }

}
