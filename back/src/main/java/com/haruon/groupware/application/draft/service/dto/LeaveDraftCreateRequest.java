package com.haruon.groupware.application.draft.service.dto;


import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

@Builder
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
                LeaveDraft.validateTime(startAt, endAt);
        }

}
