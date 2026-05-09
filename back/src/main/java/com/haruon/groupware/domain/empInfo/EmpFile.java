package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractFileEntity;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable=false)
    private Emp emp;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(nullable = false)
    private Boolean isActive;


    static EmpFile addFile(
            Emp emp,
            FileType fileType,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        EmpFile empFile = new EmpFile();

        empFile.emp = requireNonNull(emp);
        empFile.isActive = true;
        empFile.fileType = requireNonNull(fileType);

        empFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return empFile;
    }

    void activateFile() {
        this.isActive = true;
    }

    void deactivateFile() {
        this.isActive = false;
    }

}
