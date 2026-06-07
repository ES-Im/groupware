package com.haruon.groupware.application.draft.service.query.dto.response;

import java.time.LocalDate;

public record LeaveRequestHistoryResponse(
        Long draftId,
        String leaveType,
        LocalDate startAt,
        LocalDate endAt,
        Double requestedLeaveDays,
        String approvalStatus
) {
}
