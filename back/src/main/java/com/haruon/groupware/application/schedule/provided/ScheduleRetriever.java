package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.schedule.service.query.response.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.response.ScheduleResponse;
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
