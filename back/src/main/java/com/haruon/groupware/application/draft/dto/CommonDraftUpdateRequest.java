package com.haruon.groupware.application.draft.dto;

import com.haruon.groupware.domain.draft_approval.report.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

import java.util.List;

import static java.util.Objects.requireNonNull;

public record CommonDraftUpdateRequest(
        Emp emp,

        Long draftId,

        @Nullable
        @NotBlank
        @Max(100)
        String title,

        @Nullable
        @NotBlank
        @Max(500)
        String content,

        @Nullable
        List<ApproversParam> approvers
) {

    public CommonDraftUpdateRequest {
        requireNonNull(emp, "수정하는 사원 정보 필수");
        requireNonNull(draftId, "수정하는 기안서 정보 필수");
    }

    public boolean isChangeCommonField() {
        return title != null || content != null || approvers != null;
    }
}
