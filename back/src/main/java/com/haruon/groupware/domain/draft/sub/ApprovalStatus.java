package com.haruon.groupware.domain.draft.sub;

import lombok.Getter;

@Getter
public enum ApprovalStatus {
    UNSUBMITTED("미상신"),
    WAITING("결재대기"),
    IN_PROGRESS("결재진행중"),
    APPROVED("결재완료"),
    REJECTED("반려"),
    ;

    private final String description;
    ApprovalStatus(String description) {
        this.description = description;
    }
}
