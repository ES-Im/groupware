package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.empInfo.AttendanceNotFoundException;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public class AttendanceUtils {

    public static AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt,
            LocalTime endAt,
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        if(startAt == null || endAt == null) throw new RequiredValueMissingException();

        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();

        if(requiredWorkHours <= 0) throw new PositiveValueRequiredException();

        long requiredWorkMinutes = requiredWorkHours * 60;

        if (includeHalfLeave) {
            requiredWorkMinutes /= 2;
        }

        long recognizedWorkMinutes = ChronoUnit.MINUTES.between(startAt, endAt);

        if (recognizedWorkMinutes >= requiredWorkMinutes) {
            return AttendanceStatus.NORMAL;
        }

        if (recognizedWorkMinutes * 2 >= requiredWorkMinutes) {
            return AttendanceStatus.LATE_EARLY;
        }

        return AttendanceStatus.ABSENT;
    }

    public static Attendance findAttendanceById(AttendanceRepository repository, Long id) {
        return repository.findById(id).orElseThrow(AttendanceNotFoundException::new);
    }

}
