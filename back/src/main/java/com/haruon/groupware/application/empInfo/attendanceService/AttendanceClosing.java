package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseParam;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.getStatusByRecognizedHours;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.getEarlierTime;
import static com.haruon.groupware.application.utils.Utils.getLaterTime;
import static com.haruon.groupware.domain.empInfo.Attendance.*;
import static com.haruon.groupware.domain.empInfo.enums.AttendanceStatus.*;
import static com.haruon.groupware.domain.schedule.ScheduleType.BUSINESS_TRIP;
import static com.haruon.groupware.domain.schedule.ScheduleType.LEAVE;
import static java.util.Objects.requireNonNull;

@Service
@Transactional
@RequiredArgsConstructor
@Validated
public class AttendanceClosing implements com.haruon.groupware.application.empInfo.provided.AttendanceClosing {

    private final AttendanceRepository attendanceRepository;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort companyPolicy;
    private final ScheduleRepository scheduleRepository;

    private static final List<ScheduleType> SCHEDULE_FOR_ATTENDANCE_DECISION = List.of(
            BUSINESS_TRIP, LEAVE
    );

    @Override
    public int closeAttendance(AttendanceCloseParam param) {
        requireNonNull(param);
        Emp emp = findActiveEmpById(empRepository, param.empId());
        emp.ensureActive();

        int attendanceCnt = 0;

        List<Schedule> schedules = findSchedules(param.empId(), param.attendanceDate());

        if(schedules.isEmpty()) {
            attendanceCnt += confirmWithoutSchedule(emp, param.attendanceDate());
        } else {
            Schedule allDaySchedule = schedules.stream()
                                               .filter(Schedule::isAllDay)
                                               .findFirst().orElse(null);

            if(allDaySchedule != null) {
                attendanceCnt += closeDayWithAllDaySchedule(emp, param.attendanceDate(), allDaySchedule);
            } else {
                attendanceCnt += closeDayPartialSchedule(emp, param.attendanceDate(), schedules);
            }

        }

        return attendanceCnt;
    }

    private int confirmWithoutSchedule(Emp emp, LocalDate date) {

        Attendance attendance = findAttendanceByCloseParam(emp, date);

        if(attendance == null) {
            attendance = registerAttendance(
                    findActiveEmpById(empRepository, emp.getId()),
                    date,
                    ABSENT,
                    null, null
            );

            attendanceRepository.save(attendance);

        } else {

            AttendanceStatus status =
                    (attendance.getEndAt() == null) ?
                            ABSENT :
                            getStatusByRecognizedHours(
                                    attendance.getStartAt(),
                                    attendance.getEndAt(),
                                    companyPolicy.getWorkHours(),
                                    false
                            );

            changeAttendanceStatus(attendance, status);
        }

        return 1;
    }

    private int closeDayWithAllDaySchedule(Emp emp, LocalDate date, Schedule schedule) {

        Attendance mainAttendance = findAttendanceByCloseParam(emp, date);

        AttendanceStatus status;
        LocalTime startAt = null;
        LocalTime endAt = null;

        switch (schedule.getScheduleType()) {
            case LEAVE -> {
                status = ALL_DAY_LEAVE;
                startAt = companyPolicy.getStartTime();
                endAt = companyPolicy.getEndTime();
            }
            case BUSINESS_TRIP -> {
                startAt = companyPolicy.getStartTime();
                endAt = companyPolicy.getEndTime();
                status = NORMAL;
            }
            default -> throw new IllegalStateException("지원하지 않는 일정 타입");
        }

        if (mainAttendance == null) {
            Attendance newAttendance = registerAttendance(emp, date, status, startAt, endAt);
            attendanceRepository.save(newAttendance);
        } else {
            changeAttendanceTime(mainAttendance, requireNonNull(startAt), requireNonNull(endAt));
            changeAttendanceStatus(mainAttendance, status);
        }

        return 1;
    }

    private int closeDayPartialSchedule(Emp emp, LocalDate date, List<Schedule> schedules) {
        int result = 1;

        Attendance mainAttendance = findAttendanceByCloseParam(emp, date);
        Attendance subAttendance = null;

        LocalTime entireStartAt = mainAttendance != null ? mainAttendance.getStartAt() : null;
        LocalTime entireEndAt = mainAttendance != null ? mainAttendance.getEndAt() : null;

        boolean isIncludeLeave = false;

        for (Schedule schedule : schedules) {
            LocalTime scheduleStartAt = schedule.getStartAt();
            LocalTime scheduleEndAt = schedule.getEndAt();

            if (schedule.getScheduleType() == BUSINESS_TRIP) {
                entireStartAt = getEarlierTime(entireStartAt, scheduleStartAt);
                entireEndAt = getLaterTime(entireEndAt, scheduleEndAt);
            }

            if (schedule.getScheduleType() == LEAVE) {
                subAttendance = registerAttendance(
                        emp,
                        date,
                        HALF_DAY_LEAVE,
                        scheduleStartAt,
                        scheduleEndAt
                );
                isIncludeLeave = true;
                result++;
            }
        }

        boolean isAllTimeRecorded = entireStartAt != null && entireEndAt != null;

        if (!isAllTimeRecorded) {
            mainAttendance = resolveOrRegisterAbsentAttendance(mainAttendance, emp, date);
        } else {
            mainAttendance = resolveMainAttendance(
                    mainAttendance,
                    emp,
                    date,
                    entireStartAt,
                    entireEndAt,
                    isIncludeLeave
            );
        }

        attendanceRepository.save(mainAttendance);

        if (subAttendance != null) {
            attendanceRepository.save(subAttendance);
        }

        return result;
    }

    private Attendance resolveOrRegisterAbsentAttendance(
            @Nullable  Attendance mainAttendance,
            Emp emp,
            LocalDate attendanceDate
    ) {
        if (mainAttendance == null) {
            return registerAttendance(
                    emp,
                    attendanceDate,
                    ABSENT,
                    null,
                    null
            );
        }

        changeAttendanceStatus(mainAttendance, ABSENT);
        return mainAttendance;
    }

    private Attendance resolveMainAttendance(
            @Nullable Attendance mainAttendance,
            Emp emp,
            LocalDate attendanceDate,
            LocalTime startAt,
            LocalTime endAt,
            boolean isIncludeLeave
    ) {
        AttendanceStatus status = getStatusByRecognizedHours(
                startAt,
                endAt,
                companyPolicy.getWorkHours(),
                isIncludeLeave
        );

        if (mainAttendance == null) {
            return registerAttendance(
                    emp,
                    attendanceDate,
                    status,
                    startAt,
                    endAt
            );
        }

        changeAttendanceTime(mainAttendance, requireNonNull(startAt), requireNonNull(endAt));
        changeAttendanceStatus(mainAttendance, status);
        return mainAttendance;
    }

    private List<Schedule> findSchedules(Long empId, LocalDate targetDate) {
        List<Schedule> schedules = scheduleRepository.findByEmp_IdAndScheduleDate(empId, targetDate);

        return schedules.stream()
                .filter(s -> !s.isCanceled())
                .filter(s -> SCHEDULE_FOR_ATTENDANCE_DECISION.contains(s.getScheduleType()))
                .toList();
    }

    private @Nullable Attendance findAttendanceByCloseParam(Emp emp, LocalDate date) {
        return attendanceRepository.findByEmpIdAndAttendanceDate(
                emp.getId(), date
        ).stream().findFirst().orElse(null);
    }

}
