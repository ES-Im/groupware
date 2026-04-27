package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

import static java.util.Objects.requireNonNull;

@Builder
public record CommonDraftUpdateRequest(
        Long drafterId,

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
        Set<ApproversRequest> approvers
) {

    public CommonDraftUpdateRequest {
        requireNonNull(drafterId, "수정하는 사원 정보 필수");
        requireNonNull(draftId, "수정하는 기안서 정보 필수");
    }

    public boolean isChangeCommonField() {
        return title != null || content != null || approvers != null;
    }
}
