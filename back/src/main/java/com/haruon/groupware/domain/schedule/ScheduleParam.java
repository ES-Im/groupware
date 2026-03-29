package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.LeaveDraft;
import com.haruon.groupware.domain.meetingroom.Meeting;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;

import static org.springframework.util.Assert.state;

// 일정 공통 파라미터
@Builder
public record ScheduleParam(

        @Nullable
        ManualScheduleParam manual,

        @Nullable
        BusinessTripDraft businessTripDraft,

        @Nullable
        LeaveDraft leaveDraft,

        @Nullable
        Meeting meeting,

        LocalTime companyStartTime,

        LocalTime companyEndTime
) {

    public ScheduleParam {
        state(companyStartTime != null && companyEndTime != null, "회사 정책 값은 필수입력값");
        state(manual != null
                || businessTripDraft != null
                || leaveDraft != null
                || meeting != null
                , "일정 정보가 하나라도 있어야함");
    }


}
