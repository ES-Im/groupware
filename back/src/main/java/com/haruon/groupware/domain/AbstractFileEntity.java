package com.haruon.groupware.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

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

}
