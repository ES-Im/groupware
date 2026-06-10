package com.haruon.groupware.application.draft.service.command.dto.updateDraft;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

@Builder
public record CommonDraftUpdateRequest(
        @Nullable
        @Size(max = 100)
        String title,

        @Nullable
        String content,

        @Nullable
        Set<ApproversRequest> approvers
) {

    public CommonDraftUpdateRequest {
        if(title != null && title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null && content.isBlank()) throw new BlankValueNotAllowedException();
    }

    public boolean isNotChangeCommonField() {
        return title == null && content == null && approvers == null;
    }
}
