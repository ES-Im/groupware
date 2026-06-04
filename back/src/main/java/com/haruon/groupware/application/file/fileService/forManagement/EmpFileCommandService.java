package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.request.EmpFileUploadRequest;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.utils.Utils.findEmpById;

@Service
public class EmpFileCommandService extends AbstractFileManagerService<EmpFileUploadRequest> {

    private final EmpRepository empRepository;

    public EmpFileCommandService(
            FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
            FileStorage fileStorage,
            EmpRepository empRepository
    ) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.empRepository = empRepository;
    }

    @Override
    public FileDomain domain() {
        return FileDomain.EMP;
    }

    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository
                .findEmpFilePathInfoByStoredPath(request.requesterEmpId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();
        Emp emp = getEmpById(request.requesterEmpId());

        emp.removeFile(request.fileId());
    }

    @Override
    protected void saveFileMetaData(EmpFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        if(uploadRequest == null || storedInfo == null) throw new RequiredValueMissingException();

        Emp emp = getEmpById(uploadRequest.empId());
        FileDto file = uploadRequest.file();

        emp.changeEmpFile(
                uploadRequest.fileType(),
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath()
        );

    }

    private Emp getEmpById(Long empId) {
        return findEmpById(empRepository, empId);
    }
}
