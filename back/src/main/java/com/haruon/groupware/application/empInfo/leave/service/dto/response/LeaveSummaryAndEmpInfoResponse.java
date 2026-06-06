package com.haruon.groupware.application.empInfo.leave.service.dto.response;

public record LeaveSummaryAndEmpInfoResponse(
        String empNo,
        String empName,
        String deptName,
        String positionName,

        LeaveSummaryResponse leaveSummary
) {

}
