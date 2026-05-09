package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter( lombok.AccessLevel.PROTECTED )
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class EducationFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="education_id", nullable = false)
    private Education education;

    static EducationFile create(
            Education education,
            String mimeType,
            String originalName,
            String extension,
            long fileSize
    ) {
        EducationFile educationFile = new EducationFile();

        educationFile.education = requireNonNull(education);
        educationFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return educationFile;
    }

}