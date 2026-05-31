package com.haruon.groupware.application.file.fileService.forRetriever;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import org.springframework.stereotype.Service;

@Service
public class EmpFileResourceService extends AbstractFileResourceService {

    @Override
    public FileDomain domain() {
        return FileDomain.EMP;
    }

    public EmpFileResourceService(
            FileResourceQueryRepository fileResourceQueryRepository,
            FileStorage fileStorage
    ) {
        super(fileResourceQueryRepository, fileStorage);
    }

    @Override
    protected FileResourceInfo getFileResourceInfo(Long empId, Long fileId) {
        return  fileResourceQueryRepository
                .findEmpFileInfoByEmpIdAndFileIdForResource(empId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }
}
