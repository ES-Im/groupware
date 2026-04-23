package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public class AttendanceUtils {

    public static AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt,
            LocalTime endAt,
            long requiredWorkHours,
            boolean includeHalfLeave
    ) {
        requireNonNull(startAt, "근태 시작시각 필수");
        requireNonNull(endAt, "근태 종료시각 필수");

        state(!endAt.isBefore(startAt), "근태 종료시각은 시작시각보다 빠를 수 없음");
        state(requiredWorkHours > 0, "소정근로시간은 0보다 커야 함");

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
        return repository.findById(id).orElseThrow(() ->
                new IllegalArgumentException("해당 근태가 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

}
