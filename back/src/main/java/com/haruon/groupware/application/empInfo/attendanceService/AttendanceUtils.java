package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

class AttendanceUtils {

    static LocalTime getEarlierTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isAfter(baseTime))? baseTime : targetStartAt;
    }

    static LocalTime getLaterTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isBefore(baseTime))? baseTime : targetStartAt;
    }

    static AttendanceStatus getStatusByRecognizedHours(
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

    static Attendance findAttendanceById(AttendanceRepository repository, Long id) {
        return repository.findById(id).orElseThrow(() ->
                new IllegalArgumentException("해당 근태가 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

    static Emp findEmpById(EmpRepository empRepository, Long id) {
        return empRepository.findById(id).orElseThrow(() ->
                new IllegalArgumentException("해당 사원이 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

}
