package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.dto.EmpFileParam;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import static java.util.Objects.requireNonNull;

@Entity
@Getter(AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    private boolean isActive;

    static EmpFile addFile(EmpFileParam request) {
        EmpFile significate = new EmpFile();

        significate.storedName = UUID.randomUUID().toString();
        significate.isActive = true;

        significate.fileType = requireNonNull(request.fileType());
        significate.originalName = requireNonNull(request.originalName());
        significate.extension = requireNonNull(request.extension());
        significate.fileSize = requireNonNull(request.fileSize());

        return significate;
    }

    void activateFile() {
        this.isActive = true;
    }

    void deactivateFile() {
        this.isActive = false;
    }

}
