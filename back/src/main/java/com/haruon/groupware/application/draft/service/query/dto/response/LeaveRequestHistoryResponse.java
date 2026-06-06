package com.haruon.groupware.application.draft.service.query.dto.response;

import com.haruon.groupware.domain.draft.sub.LeaveType;

import java.time.LocalDate;

public record LeaveRequestHistoryResponse(
        Long draftId,

        LeaveType leaveType,
        LocalDate startAt,
        LocalDate endAt,
        Double requestedLeaveDays,

        String approvalStatus
) {
}
