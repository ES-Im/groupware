package com.haruon.groupware.domain.empInfo.dto;

import com.haruon.groupware.domain.empInfo.EmpAttendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record AttendanceCloseParam(

        Emp emp,

        LocalDate attendanceDate,

        List<Schedule> schedules,

        @Nullable
        EmpAttendance empAttendance

) {
    public AttendanceCloseParam {
        requireNonNull(attendanceDate, "근태 기준 날짜는 null일 수 없음");
        requireNonNull(emp, "사원정보가 없음");

        if(empAttendance != null) {
            state(empAttendance.getStartAt() != null, "출근기록 없음");
            state(empAttendance.getAttendanceDate() != null, "근태날짜 없음");
        }

        requireNonNull(schedules, "스케줄없으면, 빈 ArrayList 객체로 넣을 것");

        if(!schedules.isEmpty()) {
            schedules.forEach(s -> requireNonNull(s, "스케쥴 목록에 null 불가"));

            schedules = schedules.stream()  // 취소 안된거
                            .filter(s -> s.getScheduleType().equals(ScheduleType.BUSINESS_TRIP)
                                    || s.getScheduleType().equals(ScheduleType.LEAVE))
                            .filter(s -> !s.isCanceled())
                            .toList();

            List<Schedule> allDaySchedules = schedules.stream() // 종일 일정인거
                    .filter(Schedule::isAllDay)
                    .toList();

            state(allDaySchedules.size() <= 1, "종일 일정은 1개만 허용됨");

            if (!allDaySchedules.isEmpty()) {
                state(schedules.size() == 1, "종일 일정이 있으면 다른 일정은 함께 들어갈 수 없음");
            }

            List<Schedule> halfLeaveSchedules = schedules.stream()
                    .filter(s -> s.getScheduleType().equals(ScheduleType.LEAVE))
                    .toList();
            state(halfLeaveSchedules.size() <= 1, "연차는 하루에 1개만 허용됨");

            schedules.stream()
                    .filter(s -> !s.isAllDay())
                    .forEach(s -> {
                        state(s.getStartAt() != null, "일정의 시작시각 없음");
                        state(s.getEndAt() != null, "일정의 종료시각 없음");
                        state(s.getEndAt().isAfter(s.getStartAt()), "일정 종료시각은 시작시각보다 빠를 수 없음");
                    });
        }

    }
}

// 배치 순서 (to-do)
/*
    1. 활성화된 직원 조회
    2. 해당 직원 중 기준 날짜에 attendance가 있는지 조회
    3. 있다면 해당 param에 attendance를 담고
    4. 없다면 schedule을 담음
    5. attendance와 schedule 둘다 없다면 emp정보와 date를 가져와서 부재 레코드 생성
    5. 이후 EmpAttendance.closeAttendance() 실행 후 attendance도 리스트 형태이므로 closeResult 반환한걸 save()
 */
