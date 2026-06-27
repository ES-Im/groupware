package com.haruon.groupware.application.file.service.command;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.provided.forCommand.FileDeletion;
import com.haruon.groupware.application.file.provided.forCommand.FileUpload;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.application.file.service.command.dto.FilePathInfo;
import com.haruon.groupware.application.file.service.command.dto.FileUploadRequest;
import com.haruon.groupware.application.file.service.command.dto.StoreFile;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@RequiredArgsConstructor
@Transactional
public abstract class AbstractFileManagerService<T extends FileUploadRequest> implements FileUpload<T>, FileDeletion {

    protected final FileStoredInfoQueryRepository fileStoredInfoQueryRepository;
    private final FileStorage fileStorage;

    protected abstract FilePathInfo getStoredInfo(FileDeleteRequest request);
    protected abstract void deleteFileMetaData(FileDeleteRequest request);
    protected abstract void saveFileMetaData(T uploadRequest, FilePathInfo storedInfo);

    @Override
    public void deleteStoredResource(FileDeleteRequest request) {
        FilePathInfo storedInfo = getStoredInfo(request);
        if (storedInfo == null) throw new FileNotFoundException();

        deleteFileMetaData(request);
        fileStorage.delete(storedInfo.storedPath(), storedInfo.storedName());
    }

    @Override
    public void uploadResource(T uploadRequest) {
        StoreFile storedFile = fileStorage.store(uploadRequest.file(), uploadRequest.domain().name().toLowerCase(Locale.ROOT));

        try {
            saveFileMetaData(
                    uploadRequest,
                    new FilePathInfo(storedFile.storedPath(), storedFile.storedName())
            );
        } catch (RuntimeException e) {
            fileStorage.delete(storedFile.storedPath(), storedFile.storedName());
            throw e;
        }
    }
}
