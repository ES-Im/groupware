package com.haruon.groupware.application.empInfo.leave.service.dto.response;

public record LeaveSummaryResponse(
        Double annualBaseGrantDays,
        Double annualUsedDays,

        Double specialGrantDays,
        Double specialUsedDays,

        Double compensatoryGrantDays,
        Double compensatoryUsedDays
) {
}
