package com.haruon.groupware.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

import java.util.UUID;

import static java.util.Objects.requireNonNull;

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
            Long fileSize
    ) {
        this.storedName = UUID.randomUUID().toString();
        this.originalName = requireNonNull(originalName);
        this.extension = requireNonNull(extension);
        this.fileSize = requireNonNull(fileSize);
        this.mimeType = requireNonNull(mimeType);
    }

}
