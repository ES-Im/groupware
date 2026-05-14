package com.haruon.groupware.application.schedule.required;

import java.util.List;
import java.util.Optional;

public interface ScheduleQueryRepository {

    List<Long> findScheduleParticipantsByScheduleId(Long scheduleId);

    Optional<Long> countScheduleParticipantsByScheduleId(Long scheduleId);
}
