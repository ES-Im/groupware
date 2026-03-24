package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.dto.EmpFileParam;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import static java.util.Objects.requireNonNull;

@Entity
@Getter(AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpFile extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable=false)
    private Emp emp;

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

    static EmpFile addFile(Emp emp,EmpFileParam request) {
        EmpFile empFile = new EmpFile();

        empFile.storedName = UUID.randomUUID().toString();
        empFile.isActive = true;

        empFile.emp = requireNonNull(emp);
        empFile.fileType = requireNonNull(request.fileType());
        empFile.originalName = requireNonNull(request.originalName());
        empFile.extension = requireNonNull(request.extension());
        empFile.fileSize = requireNonNull(request.fileSize());

        return empFile;
    }

    void activateFile() {
        this.isActive = true;
    }

    void deactivateFile() {
        this.isActive = false;
    }

}
