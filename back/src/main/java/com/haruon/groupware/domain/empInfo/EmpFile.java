package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractFileEntity;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpFile extends AbstractFileEntity {

    private Emp emp;

    private FileType fileType;

    private boolean isActive;

    static EmpFile addFile(
            Emp emp,
            FileType fileType,
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            Long fileSize,
            String storedPath
    ) {
        EmpFile empFile = new EmpFile();

        empFile.emp = requireNonNull(emp);
        empFile.isActive = true;
        empFile.fileType = requireNonNull(fileType);

        empFile.initFileMetadata(mimeType, originalName, storedName, extension, fileSize, storedPath);

        return empFile;
    }

    void activateFile() {
        this.isActive = true;
    }

    void deactivateFile() {
        this.isActive = false;
    }

}
