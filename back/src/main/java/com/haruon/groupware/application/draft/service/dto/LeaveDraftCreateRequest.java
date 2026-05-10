package com.haruon.groupware.application.draft.service.dto;


import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.LeaveTimeNotOnTheHourException;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record LeaveDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        LeaveType leaveType

) {
        public LeaveDraftCreateRequest {
                if(param == null || startAt == null || endAt == null || leaveType == null) {
                        throw new RequiredValueMissingException();
                }

                if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();

                try {
                        LeaveDraft.validateTime(startAt, endAt);
                } catch (IllegalStateException e) {
                        throw new LeaveTimeNotOnTheHourException();
                }
        }

}
