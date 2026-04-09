package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter(AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DraftFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="dreft_id", nullable = false)
    private Draft draft;

    static DraftFile create(
            Draft draft,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        DraftFile draftFile = new DraftFile();
        draftFile.draft = requireNonNull(draft);

        draftFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return draftFile;
    }



}
