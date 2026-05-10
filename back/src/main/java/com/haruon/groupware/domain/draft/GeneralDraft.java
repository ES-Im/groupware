package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true)
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
