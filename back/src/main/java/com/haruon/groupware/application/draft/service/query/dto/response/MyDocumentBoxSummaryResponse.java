package com.haruon.groupware.application.draft.service.query.dto.response;

public record MyDocumentBoxSummaryResponse(
        Long pendingApprovalDraftCount,
        Long unsubmittedDraftCount,
        Long submittedDraftCount,
        Long accessibleDocumentCount
) {
}
