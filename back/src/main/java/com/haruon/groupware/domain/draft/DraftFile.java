package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter(AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DraftFile extends AbstractFileEntity {

    private Draft draft;

    static DraftFile create(
            Draft draft,
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            Long fileSize,
            String storedPath
    ) {
        DraftFile draftFile = new DraftFile();
        draftFile.draft = requireNonNull(draft);

        draftFile.initFileMetadata(mimeType, originalName, storedName, extension, fileSize, storedPath);

        return draftFile;
    }



}
