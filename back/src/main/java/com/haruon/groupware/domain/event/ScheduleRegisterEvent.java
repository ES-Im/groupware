package com.haruon.groupware.domain.event;

import com.haruon.groupware.domain.schedule.ScheduleType;

import java.time.LocalDate;
import java.time.LocalTime;

public interface ScheduleRegisterEvent {
    String sourceKey();
    ScheduleType scheduleType();
    Long empId();
    String title();
    String content();
    LocalDate scheduleDate();
    LocalTime startAt();
    LocalTime endAt();
    boolean isAllDay();
    boolean isPublic();
}
