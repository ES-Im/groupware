package com.haruon.groupware.application.draft.dto;

import com.haruon.groupware.domain.draft_approval.report.LeaveType;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

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
                state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        }
}
