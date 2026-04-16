package com.haruon.groupware.application.draft.service.dto;


import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.LeaveType;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

public record LeaveDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        LeaveType leaveType

) {
        public LeaveDraftCreateRequest {
                requireNonNull(param);
                requireNonNull(startAt);
                requireNonNull(endAt);
                requireNonNull(leaveType);
                validateLeaveTimes(startAt, endAt);

        }

        private void validateLeaveTimes(LocalDateTime startAt, LocalDateTime endAt) {
            LeaveDraft.validateTime(startAt, endAt);
        }
}
