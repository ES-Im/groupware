package com.haruon.groupware.application.file.service.command;

import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.application.file.service.command.dto.EmpFileUploadRequest;
import com.haruon.groupware.application.file.service.command.dto.FileDto;
import com.haruon.groupware.application.file.service.command.dto.FilePathInfo;
import com.haruon.groupware.application.file.service.support.FileDomain;
import com.haruon.groupware.domain.employee.Emp;
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
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();

        return fileStoredInfoQueryRepository
                .findEmpFilePathInfoByStoredPath(request.requesterEmpId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        Emp emp;
        if(request.requesterEmpId() != null) {
            emp = getEmpById(request.requesterEmpId());
        } else {
            throw new RequiredValueMissingException();
        }

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
