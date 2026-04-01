package com.haruon.groupware.application.empInfo;

import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public class EmpInfoUtils {

    public static AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt,
            LocalTime endAt,
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        if(includeHalfLeave) requiredWorkHours /= 2;

        long recognizedWorkHours = ChronoUnit.HOURS.between(startAt, endAt);

        if(recognizedWorkHours >= requiredWorkHours) return AttendanceStatus.NORMAL;

        if(recognizedWorkHours * 2 >= requiredWorkHours) return AttendanceStatus.LATE_EARLY;

        return AttendanceStatus.ABSENT;
    }

    public static Attendance findAttendanceById(AttendanceRepository repository, Long id) {
        return repository.findById(id).orElseThrow(() ->
                new IllegalArgumentException("해당 근태가 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

}
