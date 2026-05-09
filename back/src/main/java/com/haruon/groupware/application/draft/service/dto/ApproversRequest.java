package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record ApproversRequest(
        Long approverId,
        ApprovalRole role,
        Integer order
) {
    public ApproversRequest {
        requireNonNull(approverId);
        requireNonNull(role);
        requireNonNull(order);

        state(order>0, "결재 순서는 양수여야 함");
    }
}

