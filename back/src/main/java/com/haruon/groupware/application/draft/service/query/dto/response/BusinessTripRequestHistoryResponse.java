package com.haruon.groupware.application.draft.service.query.dto.response;

import java.time.LocalDate;

public record BusinessTripRequestHistoryResponse(
        Long draftId,
        LocalDate startAt,
        LocalDate endAt,
        String destination,
        String purpose,
        String approvalStatus
) {
}
