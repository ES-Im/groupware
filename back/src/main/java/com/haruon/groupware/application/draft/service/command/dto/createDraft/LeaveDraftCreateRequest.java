package com.haruon.groupware.application.draft.service.command.dto.createDraft;


import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.LeaveTimeNotOnTheHourException;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record LeaveDraftCreateRequest(
        @NotNull @Valid
        CommonDraftCreateRequest param,
        @NotNull
        LocalDateTime startAt,
        @NotNull
        LocalDateTime endAt,
        @NotNull
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
