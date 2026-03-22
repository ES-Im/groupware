package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class EmpFile extends AbstractEntity {

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(nullable = false)
    private String mimeType;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false, unique = true)
    private String storedName;

    @Column(nullable = false)
    private String extension;

    @Column(nullable = false)
    private Long fileSize;

    private Boolean isActive;

}
