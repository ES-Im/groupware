package com.haruon.groupware.application.file.fileService.forRetriever;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import org.springframework.stereotype.Service;

@Service
public class MessageFileResourceService extends AbstractFileResourceService {

    @Override
    public FileDomain domain() {
        return FileDomain.MESSAGE;
    }

    public MessageFileResourceService(
            FileResourceQueryRepository fileResourceQueryRepository,
            FileStorage fileStorage
    ) {
        super(fileResourceQueryRepository, fileStorage);
    }

    protected FileResourceInfo getFileResourceInfo(Long messageId, Long fileId) {
        return  fileResourceQueryRepository
                .findMessageFileInfoByMessageIdAndFileIdForResource(messageId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }

}
