package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@DiscriminatorValue("GENERAL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GeneralDraft extends Draft {

    private GeneralDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static GeneralDraft createDraft(
            Emp emp,
            String title,
            String content,
            @Nullable List<ApproversParam> approvers
    ) {
        GeneralDraft generalDraft = new GeneralDraft(title, content, emp);

        generalDraft.createDraftApproval(approvers);

        return generalDraft;
    }

    public static GeneralDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            List<ApproversParam> approvers,
            LocalDateTime submittedAt
    ) {
        GeneralDraft generalDraft = new GeneralDraft(title, content, emp);

        generalDraft.createSubmittedApproval(approvers, submittedAt);

        return generalDraft;
    }

    public void editGeneralDraft(
            @Nullable String title,
            @Nullable String content
    ) {
        editDraft(title, content);
    }

}
