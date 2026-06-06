package com.haruon.groupware.application.draft.service.query.dto.response;

public record LeaveRequestHistoryAndEmpInfoResponse(
        Long empId,
        String empNo,
        String empName,
        LeaveRequestHistoryResponse historyResponse
) {
}
