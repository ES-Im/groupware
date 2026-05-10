package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.ApprovalLineRequiredException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CommonDraftCreateRequest(
        Long empId,

        String title,

        String content,

        @Nullable List<ApproversRequest> approvers,

        @Nullable LocalDateTime submittedAt
) {

    public CommonDraftCreateRequest {
        if(empId == null || title == null || content == null) throw new RequiredValueMissingException();

        if(submittedAt != null && !(approvers != null && !approvers.isEmpty())) {
            throw new ApprovalLineRequiredException();
        }

        if(title.isBlank()) throw new BlankValueNotAllowedException();
        if(content.isBlank()) throw new BlankValueNotAllowedException();
    }



}
