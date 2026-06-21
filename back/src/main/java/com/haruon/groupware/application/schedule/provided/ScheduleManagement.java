package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.schedule.service.command.request.ManualScheduleCreateRequest;
import com.haruon.groupware.application.schedule.service.command.request.ManualScheduleUpdateRequest;

import java.util.Set;

/**
 * 일정 수기등록/수정/취소
 */
public interface ScheduleManagement {

    String registerSchedules(Long ownerId, ManualScheduleCreateRequest param);

    void addParticipants(Long scheduleId, Long ownerId, Set<Long> participantEmpIds, boolean isForBulkEdit);

    void removeParticipants(Long scheduleId, Long ownerId, Set<Long> participantEmpIds, boolean isForBulkEdit);

    void cancelSchedule(Long scheduleId, Long ownerId, boolean isForBulkEdit);

    void updateManualSchedule(Long scheduleId, Long ownerId, boolean isForBulkEdit, ManualScheduleUpdateRequest param);

}
