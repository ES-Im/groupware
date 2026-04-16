package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.domain.draft.sub.LeaveType;

import java.time.LocalDateTime;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

public record LeaveDraftUpdateRequest(

        CommonDraftUpdateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        LeaveType leaveType

) {
        public LeaveDraftUpdateRequest {
                requireNonNull(param, "기안서 기본 정보 필수");
                state(param.isChangeCommonField() ||
                                startAt != null ||
                                endAt != null ||
                                leaveType != null,
                        "변경내용이 없음");
        }
}
