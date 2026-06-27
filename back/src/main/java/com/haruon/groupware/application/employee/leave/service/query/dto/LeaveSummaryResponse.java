package com.haruon.groupware.application.employee.leave.service.query.dto;

public record LeaveSummaryResponse(
        Double annualBaseGrantDays,
        Double annualUsedDays,

        Double specialGrantDays,
        Double specialUsedDays,

        Double compensatoryGrantDays,
        Double compensatoryUsedDays
) {
}
