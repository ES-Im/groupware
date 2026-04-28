package com.haruon.groupware.application.draft.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record CommonDraftUpdateRequest(
        Long drafterId,

        Long draftId,

        @Nullable
        String title,

        @Nullable
        String content,

        @Nullable
        Set<ApproversRequest> approvers
) {

    public CommonDraftUpdateRequest {
        requireNonNull(drafterId, "수정하는 사원 정보 필수");
        requireNonNull(draftId, "수정하는 기안서 정보 필수");

        if(title != null) state(!title.isBlank(), "제목은 공백이 될 수 없음");
        if(content != null) state(!content.isBlank(), "내용은 공백이 될 수 없음");
    }

    public boolean isChangeCommonField() {
        return title != null || content != null || approvers != null;
    }
}
