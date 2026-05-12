package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.exception.schedule.ScheduleNotFoundException;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ScheduleSupport {

    static List<Schedule> getSchedulesById(ScheduleRepository scheduleRepository, Long scheduleId, boolean isForBulkEdit) {
        Schedule schedule = getScheduleById(scheduleRepository, scheduleId);

        return isForBulkEdit
                ? getSameEventSchedules(scheduleRepository, schedule.getSourceKey())
                : List.of(schedule);
    }

    static List<Schedule> getSchedulesBySourceKey(ScheduleRepository scheduleRepository, String sourceKey) {
        return getSameEventSchedules(scheduleRepository, sourceKey);
    }

    static Schedule getScheduleById(ScheduleRepository scheduleRepository, Long scheduleId) {
        return scheduleRepository
                .findById(scheduleId)
                .orElseThrow(ScheduleNotFoundException::new);
    }

    static List<Schedule> getSameEventSchedules(ScheduleRepository scheduleRepository, String sourceKey) {
        List<Schedule> schedules = scheduleRepository.findSchedulesBySourceKey(sourceKey);

        if(schedules.isEmpty()) throw new ScheduleNotFoundException();

        return schedules;
    }

    static List<Schedule> registerSchedule(
            CompanyPolicyPort port,
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt,
            ScheduleType type,
            String title, String content,
            Emp scheduleOwner, Set<Emp> participants,
            String sourceKey
    ) {
        scheduleOwner.ensureActive();
        List<Schedule> schedules = new ArrayList<>();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for (int i = 0; i <= days; i++) {
            LocalDate targetDate = startDate.plusDays(i);

            TimeRange timeRange = getTimesPerDay(
                    port, startDate, endDate,
                    targetDate, startAt, endAt
            );

            Schedule schedule = Schedule.registerSchedule(
                    sourceKey,
                    type,
                    scheduleOwner,
                    title, content,
                    targetDate,
                    timeRange.startAt(), timeRange.endAt(),
                    timeRange.isAllDay()
            );

            for (Emp participant : participants) {
                schedule.addParticipant(participant);
            }

            schedules.add(schedule);
        }

        return schedules;
    }


    static TimeRange getTimesPerDay(
            CompanyPolicyPort port,
            LocalDate startDate,
            LocalDate endDate,
            LocalDate targetDate,
            LocalTime startAt,
            LocalTime endAt
    ) {
        if (startDate.equals(endDate)) {
            return new TimeRange(
                    startAt,
                    endAt,
                    startAt.equals(port.getStartTime()) && endAt.equals(port.getEndTime())
            );
        }

        if (targetDate.equals(startDate)) {
            return new TimeRange(
                    startAt,
                    port.getEndTime(),
                    startAt.equals(port.getStartTime())
            );
        }

        if (targetDate.equals(endDate)) {
            return new TimeRange(
                    port.getStartTime(),
                    endAt,
                    endAt.equals(port.getEndTime())
            );
        }

        return new TimeRange(port.getStartTime(), port.getEndTime(), true);
    }



    record TimeRange(
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }


}
