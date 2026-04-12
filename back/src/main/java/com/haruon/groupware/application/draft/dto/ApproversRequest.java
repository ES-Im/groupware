package com.haruon.groupware.application.draft.dto;

import com.haruon.groupware.domain.draft_approval.report.ApprovalRole;

public record ApproversRequest(
        long approverId,
        ApprovalRole role,
        int order
) {
}

