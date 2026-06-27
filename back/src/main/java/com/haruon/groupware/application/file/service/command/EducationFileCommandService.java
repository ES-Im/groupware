package com.haruon.groupware.application.file.service.command;

import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.application.file.service.command.dto.EducationFileUploadRequest;
import com.haruon.groupware.application.file.service.command.dto.FileDto;
import com.haruon.groupware.application.file.service.command.dto.FilePathInfo;
import com.haruon.groupware.application.file.service.support.FileDomain;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.franchise.Education;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.support.FranchiseUtils.findEducation;
import static com.haruon.groupware.application.franchise.service.support.FranchiseUtils.validateRegister;

@Service
public class EducationFileCommandService extends AbstractFileManagerService<EducationFileUploadRequest> {

    private final EmpRepository empRepository;
    private final EducationRepository educationRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    public EducationFileCommandService(
            FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
            FileStorage fileStorage,
            EmpRepository empRepository,
            EducationRepository educationRepository,
            AuthorizationQueryRepository authorizationQueryRepository
    ) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.empRepository = empRepository;
        this.educationRepository = educationRepository;
        this.authorizationQueryRepository = authorizationQueryRepository;
    }

    @Override
    public FileDomain domain() {
        return FileDomain.EDUCATION;
    }

    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository
                .findEducationFilePathInfoByStoredPath(request.domainPkId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();

        Education education = findEducation(educationRepository, request.domainPkId());
        validateRegister(empRepository, authorizationQueryRepository, education, request.requesterEmpId());

        education.removeEducationFile(request.fileId());
    }

    @Override
    protected void saveFileMetaData(EducationFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        if(uploadRequest == null || storedInfo == null) throw new RequiredValueMissingException();

        Education education = findEducation(educationRepository, uploadRequest.educationId());
        validateRegister(empRepository, authorizationQueryRepository, education, uploadRequest.registerId());

        FileDto file = uploadRequest.file();

        education.addEducationFile(
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath()
        );
    }
}
