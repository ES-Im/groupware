package com.haruon.groupware.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

import java.util.UUID;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@MappedSuperclass
public abstract class AbstractFileEntity extends AbstractEntity {

    @Column(nullable = false)
    protected String originalName;

    @Column(nullable = false, unique = true)
    protected String storedName;

    @Column(nullable = false)
    protected String mimeType;

    @Column(nullable = false)
    protected String extension;

    @Column(nullable = false)
    protected Long fileSize;


    protected void initFileMetadata(
            String mimeType,
            String originalName,
            String extension,
            long fileSize
    ) {
        state(fileSize > 0, "파일 용량은 0보다 커야한다");

        requireNonNull(originalName);
        state(!originalName.isBlank(), "원본파일명은 빈값이 올 수 없다.");

        requireNonNull(mimeType);
        state(!mimeType.isBlank(), "mimeType은 빈갓이 올 수 없다");

        requireNonNull(extension);
        state(!extension.isBlank(), "확장자명은 빈 값이 올 수 없다.");


        this.storedName = UUID.randomUUID().toString();
        this.originalName = requireNonNull(originalName);
        this.extension = requireNonNull(extension);
        this.fileSize = fileSize;
        this.mimeType = requireNonNull(mimeType);
    }

}
