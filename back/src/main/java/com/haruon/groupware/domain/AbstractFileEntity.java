package com.haruon.groupware.domain;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@MappedSuperclass
public abstract class AbstractFileEntity extends AbstractEntity {

    protected String originalName;

    protected String storedName;

    protected String mimeType;

    protected String extension;

    protected Long fileSize;

    protected String storedPath;


    protected void initFileMetadata(
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            long fileSize,
            String storedPath
    ) {
        state(fileSize > 0, "파일 용량은 0보다 커야한다");

        requireNonNull(originalName);
        state(!originalName.isBlank(), "원본파일명은 빈값이 올 수 없다.");

        requireNonNull(storedName);
        state(!storedName.isBlank(), "저장파일명 빈값이 올 수 없다.");

        requireNonNull(storedPath);
        state(!storedPath.isBlank(), "저장경로는 빈값이 올 수 없다.");

        requireNonNull(mimeType);
        state(!mimeType.isBlank(), "mimeType은 빈갓이 올 수 없다");

        requireNonNull(extension);
        state(!extension.isBlank(), "확장자명은 빈 값이 올 수 없다.");


        this.storedName = storedName;
        this.originalName = originalName;
        this.extension = extension;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.storedPath = storedPath;
    }

}
