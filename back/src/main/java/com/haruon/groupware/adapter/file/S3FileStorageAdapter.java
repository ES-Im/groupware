package com.haruon.groupware.adapter.file;

import com.haruon.groupware.adapter.webapi.exception.auth.FileStoreFailedException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.service.command.dto.FileDto;
import com.haruon.groupware.application.file.service.command.dto.StoreFile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Component
@Profile("prod")
@RequiredArgsConstructor
public class S3FileStorageAdapter implements FileStorage {

    private final S3Client s3client;
    @Value("${AWS_S3_BUCKET_NAME}") private String BUCKET_NAME;

    private String createStoredFileName(String extension) {
        return UUID.randomUUID() + "." + extension;
    }

    private String toKey(String storedPath, String storedFileName) {
        return String.format(
                "%s/%s",
                storedPath, storedFileName
        );
    }

    @Override
    public StoreFile store(FileDto fileDto, String storedPath) {    //storedPath == fileType
        String storedFileName = createStoredFileName(fileDto.extension());

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(toKey(storedPath, storedFileName))
                .contentType(fileDto.mimeType())
                .build();

        InputStream inputStream = null;
        try {
            inputStream = fileDto.resource().getInputStream();
            s3client.putObject(
                    objectRequest,
                    RequestBody.fromInputStream(
                            inputStream, fileDto.fileSize()
                    )
            );

            return new StoreFile(
                    fileDto.originalFileName(),
                    storedFileName,
                    fileDto.mimeType(),
                    fileDto.extension(),
                    fileDto.fileSize(),
                    storedPath
            );

        } catch (SdkException | IOException e) {
            throw new FileStoreFailedException();
        } finally {
            if(inputStream != null) {
                try {    inputStream.close();   }
                catch (IOException ignore) {}
            }
        }
    }

    @Override
    public Resource loadAsResource(String storedPath, String storedName) {
        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(toKey(storedPath, storedName))
                .build();

        try {
            ResponseInputStream<GetObjectResponse> response
                    = s3client.getObject(objectRequest);

            return new InputStreamResource(response);
        } catch (NoSuchKeyException e) {
            throw new FileNotFoundException();
        }
    }

    @Override
    public void delete(String storedPath, String storedName) {
        DeleteObjectRequest objectRequest = DeleteObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(toKey(storedPath, storedName))
                .build();

        s3client.deleteObject(objectRequest);

    }
}
