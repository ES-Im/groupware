package com.haruon.groupware.application.draft.service.query.dto.response;

import com.haruon.groupware.domain.draft.sub.ApprovalStatus;

import java.time.LocalDateTime;

public record DocumentBoxResponse(
        Long draftId,
        String drafterName,
        String draftTitle,
        LocalDateTime submittedAt,
        String latestApproverName,    // 해당 시점의 마지막 결재 승인자
        Boolean isFileAttached,
        String approvalStatus
) {
    public DocumentBoxResponse(
            Long draftId,
            String drafterEmpName,
            String draftTitle,
            LocalDateTime submittedAt,
            String latestApproverName,
            Boolean isFileAttached,
            ApprovalStatus approvalStatus
    ) {
        this(
                draftId,
                drafterEmpName,
                draftTitle,
                submittedAt,
                latestApproverName,
                isFileAttached,
                approvalStatus.getDescription()
        );
    }
}
