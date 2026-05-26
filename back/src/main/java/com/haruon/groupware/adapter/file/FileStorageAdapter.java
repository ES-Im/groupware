package com.haruon.groupware.adapter.file;

import com.haruon.groupware.adapter.webapi.exception.auth.FileStoreFailedException;
import com.haruon.groupware.application.utils.file.FileDto;
import com.haruon.groupware.application.utils.file.StoreFile;
import com.haruon.groupware.application.utils.file.required.FileStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Component
public class FileStorageAdapter implements FileStorage {

    @Value("${FILE_UPLOAD_ROOT_DIR}")
    private String FILE_UPLOAD_ROOT_DIR;

    private Path getPath(String fileType) {
        return Path.of(FILE_UPLOAD_ROOT_DIR + "/" + fileType);
    }

    private String createStoredFileName(String extension) {
        return UUID.randomUUID() + "." + extension;
    }


    @Override
    public StoreFile store(FileDto fileDto, String type) {
        try {
            Path storedPath = getPath(type);
            Files.createDirectories(storedPath);
            String storedFileName = createStoredFileName(fileDto.extension());

            Path storedFilePath = storedPath.resolve(storedFileName);

            Files.write(storedFilePath, fileDto.bytes());

            return new StoreFile(
                    fileDto.originalFileName(),
                    storedFileName,
                    fileDto.mimeType(),
                    fileDto.extension(),
                    fileDto.fileSize(),
                    storedFilePath.toString()
            );

        } catch (IOException e) {
            throw new FileStoreFailedException();
        }

    }
}
