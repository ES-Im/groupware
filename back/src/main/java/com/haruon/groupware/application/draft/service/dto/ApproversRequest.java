package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.domain.draft.ApprovalRole;

public record ApproversRequest(
        long approverId,
        ApprovalRole role,
        int order
) {
}

