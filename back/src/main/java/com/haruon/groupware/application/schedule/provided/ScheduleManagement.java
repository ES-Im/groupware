package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.schedule.service.ManualScheduleParam;

import java.util.Set;

/**
 * 일정 수기등록/수정/취소
 */
public interface ScheduleManagement {

    String registerSchedules(ManualScheduleParam param);

    void addParticipants(Long scheduleId, Set<Long> empId, boolean isForBulkEdit);

    void removeParticipants(Long scheduleId, Set<Long> empId, boolean isForBulkEdit);

    void cancelSchedule(Long scheduleId, boolean isForBulkEdit);

    void updateManualSchedule(Long scheduleId, boolean isForBulkEdit, ManualScheduleParam param);

}
