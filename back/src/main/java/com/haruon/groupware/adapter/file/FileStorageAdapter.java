package com.haruon.groupware.adapter.file;

import com.haruon.groupware.adapter.webapi.exception.auth.FileStoreFailedException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import com.haruon.groupware.application.file.required.FileStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.MalformedURLException;
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
                    storedPath.toString()
            );

        } catch (IOException e) {
            throw new FileStoreFailedException();
        }

    }

    @Override
    public Resource loadAsResource(String storedPath, String storedName) {
        try {
            if (storedPath == null || storedPath.isBlank() || storedName == null || storedName.isBlank()) {
                throw new FileNotFoundException();
            }

            Path directory = Path.of(storedPath).normalize();
            Path path = directory.resolve(storedName).normalize();

            if (!path.startsWith(directory)) throw new FileNotFoundException();

            Resource resource = new UrlResource(path.toUri());

            if(!resource.exists() || !resource.isReadable()) throw new FileNotFoundException();

            return resource;
        } catch (MalformedURLException e) {
            throw new FileNotFoundException();
        }
    }
}
