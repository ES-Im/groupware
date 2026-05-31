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
            Path path = validateStoredPathName(storedPath, storedName);

            Resource resource = new UrlResource(path.toUri());

            if(!resource.exists() || !resource.isReadable()) throw new FileNotFoundException();

            return resource;
        } catch (MalformedURLException e) {
            throw new FileNotFoundException();
        }
    }

    @Override
    public void delete(String storedPath, String storedName) {
        try {
            Path path = validateStoredPathName(storedPath, storedName).toAbsolutePath().normalize();

            if(!Files.exists(path) || !Files.isRegularFile(path)) throw new FileNotFoundException();

            Files.delete(path);

        } catch (IOException e) {
            throw new FileNotFoundException();
        }
    }

    private Path validateStoredPathName(String storedPath, String storedName) {
        if (storedPath == null || storedPath.isBlank() || storedName == null || storedName.isBlank()) {
            throw new FileNotFoundException();
        }

        Path directory = Path.of(storedPath).normalize();
        Path path = directory.resolve(storedName).normalize();

        if(!path.startsWith(directory)) throw new FileNotFoundException();

        return path;
    }

}

/*todo : 이어서 할거
    1. /me api에서 파일 삭제 시, 물리삭제 로직 추가 -> 위에 Resource 조회까지만 적용함
    2. EmpApi에서 사원 단건 조회 테스트 필요
 */

