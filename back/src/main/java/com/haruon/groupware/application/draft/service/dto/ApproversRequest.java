package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;

public record ApproversRequest(
        Long approverId,
        ApprovalRole role,
        Integer order
) {

    public ApproversRequest {
        if(approverId == null || role == null || order == null) throw new RequiredValueMissingException();

        if(order <= 0) throw new PositiveValueRequiredException();
    }
}

