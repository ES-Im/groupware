package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record LeaveDraftUpdateRequest(

        CommonDraftUpdateRequest param,

        @Nullable
        LocalDateTime startAt,

        @Nullable
        LocalDateTime endAt,

        @Nullable
        LeaveType leaveType

) {
        public LeaveDraftUpdateRequest {
                if(param == null || (param.isNotChangeCommonField() &&
                  (startAt == null && endAt == null && leaveType == null))
                ) {
                        throw new RequiredValueMissingException();
                }
        }
}
