package com.haruon.groupware.domain.empInfo.attendance.dto;

import com.haruon.groupware.domain.empInfo.attendance.AttendanceStatus;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record AttendanceEditParam(

        LocalDateTime editedAt,

        String editReason,

        Emp editedBy,

        @Nullable
        LocalTime startAt,

        @Nullable
        LocalTime endAt,

        @Nullable
        AttendanceStatus status
) {

    public AttendanceEditParam {
        requireNonNull(editedAt, "편집시간 정보 필수");
        requireNonNull(editReason, "편집사유 정보 필수");
        requireNonNull(editedBy, "편집자 정보 필수");
        state(!(startAt == null && endAt == null && status == null), "수정할 근태 정보가 없음");
    }
}
