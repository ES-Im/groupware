package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.meeting.Meeting;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

// 일정 공통 파라미터
@Builder
public record ScheduleCreateRequest(

        @Nullable
        ManualScheduleParam manual,

        @Nullable
        BusinessTripDraft businessTripDraft,

        @Nullable
        LeaveDraft leaveDraft,

        @Nullable
        Meeting meeting,

        boolean isPublic
) {

    public ScheduleCreateRequest {

        int sourceCount = 0;

        if (manual != null) {
            sourceCount++;

            validateTime(manual.startAt(), manual.endAt());
        }
        if (businessTripDraft != null) {
            sourceCount++;

            validateTime(businessTripDraft.getStartAt(), businessTripDraft.getEndAt());
        }
        if (leaveDraft != null) {
            sourceCount++;

            validateTime(leaveDraft.getStartAt(),  leaveDraft.getEndAt());
        }
        if (meeting != null) {
            sourceCount++;
            validateTime(meeting.getStartAt(),  meeting.getEndAt());
        }

        state(sourceCount == 1, "일정 원본 정보는 정확히 하나만 있어야 함");
    }

    private void validateTime(LocalDateTime startAt, LocalDateTime endAt) {
        requireNonNull(startAt, "시작시간 없음");
        requireNonNull(endAt, "종료시간 없음");

        state(!endAt.isBefore(startAt), "종료시간이 시작시간보다 앞설 수 없음");
    }

    private void validateTime(LocalTime startAt, LocalTime endAt) {
        requireNonNull(startAt, "시작시간 없음");
        requireNonNull(endAt, "종료시간 없음");
        state(!endAt.isBefore(startAt), "종료시간이 시작시간보다 앞설 수 없음");
    }

}
