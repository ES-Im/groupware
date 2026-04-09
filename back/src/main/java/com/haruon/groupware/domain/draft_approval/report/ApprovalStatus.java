package com.haruon.groupware.domain.draft_approval.report;

import lombok.Getter;

@Getter
public enum ApprovalStatus {
    UNSUBMITTED,
    WAITING,
    IN_PROGRESS,
    APPROVED,
    REJECTED,
}
