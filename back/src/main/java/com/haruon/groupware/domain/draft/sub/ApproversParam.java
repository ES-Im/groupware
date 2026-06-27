package com.haruon.groupware.domain.draft.sub;

import com.haruon.groupware.domain.employee.Emp;

public record ApproversParam(
        ApprovalRole role,
        int order,
        Emp approver
) {
}
