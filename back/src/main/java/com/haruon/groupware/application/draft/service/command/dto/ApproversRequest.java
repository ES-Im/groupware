package com.haruon.groupware.application.draft.service.command.dto;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ApproversRequest(
        @NotNull Long approverId,
        @NotNull ApprovalRole role,
        @NotNull @Positive Integer order
) {

    public ApproversRequest {
        if(approverId == null || role == null || order == null) throw new RequiredValueMissingException();

        if(order <= 0) throw new PositiveValueRequiredException();
    }
}

