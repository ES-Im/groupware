package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.empInfo.Emp;

public record ApproversParam(
        ApprovalRole role,
        int order,
        Emp approver
) {
}
