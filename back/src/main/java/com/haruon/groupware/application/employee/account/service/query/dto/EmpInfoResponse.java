package com.haruon.groupware.application.employee.account.service.query.dto;

import java.util.List;

public record EmpInfoResponse(
        EmpBasicInfo empBasicInfo,
        List<EmpFileListInfo> activeFiles,
        List<BelongingInfo> currentDepts
) {
}
