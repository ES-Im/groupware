package com.haruon.groupware.application.schedule.provided.forRetriever;

import com.haruon.groupware.application.schedule.service.query.dto.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleResponse;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRetriever {

    List<ScheduleResponse> retrieveSchedules(
            Long empId, LocalDateTime targetStart, LocalDateTime targetEnd, @Nullable ScheduleType scheduleType
    );

    ScheduleDetailResponse retrieveSchedule(Long empId, Long scheduleId);
}
