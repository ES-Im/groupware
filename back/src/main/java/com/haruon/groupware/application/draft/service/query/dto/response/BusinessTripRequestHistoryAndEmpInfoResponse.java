package com.haruon.groupware.application.draft.service.query.dto.response;

public record BusinessTripRequestHistoryAndEmpInfoResponse(
        Long empId,
        String empNo,
        String empName,
        BusinessTripRequestHistoryResponse historyResponse
) {
}
