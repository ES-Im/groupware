package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EducationFile extends AbstractFileEntity {

    private Education education;

    static EducationFile create(
            Education education,
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            long fileSize,
            String storedPath
    ) {
        EducationFile educationFile = new EducationFile();

        educationFile.education = requireNonNull(education);
        educationFile.initFileMetadata(mimeType, originalName, storedName, extension, fileSize, storedPath);

        return educationFile;
    }

}
