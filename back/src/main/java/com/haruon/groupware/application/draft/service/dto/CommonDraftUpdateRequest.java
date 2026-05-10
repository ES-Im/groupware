package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

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
        if(drafterId == null || draftId == null) throw new RequiredValueMissingException();

        if(title != null && title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null && content.isBlank()) throw new BlankValueNotAllowedException();
    }

    public boolean isNotChangeCommonField() {
        return title == null && content == null && approvers == null;
    }
}
