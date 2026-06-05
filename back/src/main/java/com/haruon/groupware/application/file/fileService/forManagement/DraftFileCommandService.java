package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.request.DraftFileUploadRequest;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.domain.draft.Draft;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;

@Service
public class DraftFileCommandService extends AbstractFileManagerService<DraftFileUploadRequest> {

    private final DraftRepository draftRepository;
    private final EmpRepository empRepository;

    public DraftFileCommandService(
            FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
            FileStorage fileStorage,
            DraftRepository draftRepository,
            EmpRepository empRepository) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.draftRepository = draftRepository;
        this.empRepository = empRepository;
    }

    @Override
    public FileDomain domain() {
        return FileDomain.DRAFT;
    }

    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository
                .findDraftFilePathInfoByStoredPath(request.domainPkId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();
        Draft draft = findDraftByDraftIdAndEmpId(request.domainPkId(), request.requesterEmpId());

        draft.removeFile(request.fileId());
    }

    @Override
    protected void saveFileMetaData(DraftFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        if(uploadRequest == null || storedInfo == null) throw new RequiredValueMissingException();

        Draft draft = findDraftByDraftIdAndEmpId(uploadRequest.draftId(), uploadRequest.drafterId());
        FileDto file = uploadRequest.file();


        draft.addFile(
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath()
        );
    }

    private Draft findDraftByDraftIdAndEmpId(Long draftId, Long drafterId) {
        return draftRepository.findByIdAndEmp(
                        draftId, findActiveEmpById(empRepository, drafterId)
        ).orElseThrow(DraftNotFoundException::new);
    }
}
