package com.haruon.groupware.domain.draft.sub;

import lombok.Getter;

@Getter
public enum ApprovalStatus {
    UNSUBMITTED,
    WAITING,
    IN_PROGRESS,
    APPROVED,
    REJECTED,
}
