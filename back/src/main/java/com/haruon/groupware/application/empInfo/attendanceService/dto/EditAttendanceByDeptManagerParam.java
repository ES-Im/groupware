package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record EditAttendanceByDeptManagerParam(

        Long attendanceId,

        @Nullable LocalTime startAt,
        @Nullable LocalTime endAt,
        @Nullable AttendanceStatus status,

        LocalDateTime editedAt,
        String editReason,
        Long editorId,

        boolean isIncludeHalfLeaveInDay,

        @Nullable SubAttendanceByDeptManagerParam newSubAttendance

) {
    public EditAttendanceByDeptManagerParam {
        requireNonNull(attendanceId, "수정대상 근태 필수");
        requireNonNull(editedAt, "편집시간 정보 필수");
        requireNonNull(editReason, "편집사유 정보 필수");
        requireNonNull(editorId, "편집자 정보 필수");

        boolean hasMainAttendanceEdit = startAt != null || endAt != null || status != null;
        boolean hasNewSubAttendance = newSubAttendance != null;

        state(hasMainAttendanceEdit || hasNewSubAttendance, "수정할 근태 정보가 없음");

        if (startAt != null && endAt != null) {
            state(!endAt.isBefore(startAt), "종료시각은 시작시각보다 빠를 수 없음");
        }
    }
}