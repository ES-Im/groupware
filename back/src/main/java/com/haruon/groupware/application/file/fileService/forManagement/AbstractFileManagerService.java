package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.request.FileUploadRequest;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import com.haruon.groupware.application.file.provided.FileDeletion;
import com.haruon.groupware.application.file.provided.FileUpload;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
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
