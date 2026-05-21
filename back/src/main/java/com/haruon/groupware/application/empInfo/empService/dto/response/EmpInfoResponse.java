package com.haruon.groupware.application.empInfo.empService.dto.response;

import java.util.List;

public record EmpInfoResponse(
        EmpBasicInfo empBasicInfo,
        List<EmpFileInfo> activeFiles,
        List<BelongingInfo> currentDepts
) {
}
