package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.request.MessageFileUploadRequest;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.message.service.MessageUtils.findMessage;
import static com.haruon.groupware.application.utils.AuthorizationValidator.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpById;

@Service
public class MessageFileManagerService extends AbstractFileManagerService<MessageFileUploadRequest> {

    private final MessageRepository messageRepository;
    private final EmpRepository empRepository;

    @Override
    public FileDomain domain() {
        return FileDomain.MESSAGE;
    }

    public MessageFileManagerService(
            FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
            FileStorage fileStorage,
            MessageRepository messageRepository,
            EmpRepository empRepository
    ) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.messageRepository = messageRepository;
        this.empRepository = empRepository;
    }


    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository.findMessageFilePathInfoByStoredPath(request.domainPkId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        Message message = findMessageById(request);
        Emp sender = getEmpById(request);

        message.removeFile(sender, request.fileId());
    }

    @Override
    protected void saveFileMetaData(MessageFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        if(uploadRequest == null || storedInfo == null) throw new RequiredValueMissingException();

        Message found = findMessage(messageRepository, uploadRequest.messageDraftId());
        Emp writer = findActiveEmpById(empRepository, uploadRequest.writerId());
        FileDto file = uploadRequest.file();

        found.addFile(
                writer,
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath()
        );
    }

    private Emp getEmpById(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();

        return findEmpById(empRepository, request.requesterEmpId());
    }

    private Message findMessageById(FileDeleteRequest request) {
        return messageRepository.findById(request.domainPkId())
                .orElseThrow(MessageNotFoundException::new);
    }
}
