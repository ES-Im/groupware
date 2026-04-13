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
                validateLeaveTimes(startAt, endAt);

        }

        private void validateLeaveTimes(LocalDateTime startAt, LocalDateTime endAt) {
                state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
                state(startAt.getMinute() == 0 && startAt.getSecond() == 0 && startAt.getNano() == 0,
                        "휴가 시작시각은 정각이어야 한다.");
                state(endAt.getMinute() == 0 && endAt.getSecond() == 0 && endAt.getNano() == 0,
                        "휴가 종료시각은 정각이어야 한다.");
        }
}
