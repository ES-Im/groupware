package com.haruon.groupware.application.employee.attendance.service.support;

import com.haruon.groupware.application.employee.attendance.required.AttendanceRepository;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.employee.attendance.AttendanceNotFoundException;
import com.haruon.groupware.domain.employee.Attendance;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public class AttendanceUtils {

    public static AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt,
            LocalTime endAt,
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        int requiredWorkMinutes = calculateRequiredWorkMinutes(requiredWorkHours, includeHalfLeave);
        long recognizedWorkMinutes = calculateRecognizedWorkMinutes(startAt, endAt);

        if (recognizedWorkMinutes >= requiredWorkMinutes) {
            return AttendanceStatus.NORMAL;
        }

        if (recognizedWorkMinutes * 2 >= requiredWorkMinutes) {
            return AttendanceStatus.LATE_EARLY;
        }

        return AttendanceStatus.ABSENT;
    }

    public static int calculateOvertimeMinutes(
            @Nullable AttendanceStatus status,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        if(status == null || startAt == null || endAt == null) return 0;

        if (!(status == AttendanceStatus.NORMAL || status == AttendanceStatus.LATE_EARLY)) {
            return 0;
        }

        int requiredWorkMinutes = calculateRequiredWorkMinutes(requiredWorkHours, includeHalfLeave);
        int recognizedWorkMinutes = calculateRecognizedWorkMinutes(startAt, endAt);

        return Math.max(recognizedWorkMinutes - requiredWorkMinutes, 0);
    }

    public static Attendance findAttendanceById(AttendanceRepository repository, Long id) {
        return repository.findById(id).orElseThrow(AttendanceNotFoundException::new);
    }

    private static int calculateRequiredWorkMinutes(
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        if(requiredWorkHours <= 0) throw new PositiveValueRequiredException();

        long requiredWorkMinutes = requiredWorkHours * 60L;

        if (includeHalfLeave) {
            requiredWorkMinutes /= 2;
        }

        return Math.toIntExact(requiredWorkMinutes);
    }

    private static int calculateRecognizedWorkMinutes(LocalTime startAt, LocalTime endAt) {
        if(startAt == null || endAt == null) throw new RequiredValueMissingException();

        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();

        return Math.toIntExact(ChronoUnit.MINUTES.between(startAt, endAt));
    }

}
