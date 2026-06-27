package com.haruon.groupware.application.employee.leave.service.query.dto;

public record LeaveSummaryAndEmpInfoResponse(
        String empNo,
        String empName,
        String deptName,
        String positionName,

        LeaveSummaryResponse leaveSummary
) {

}
