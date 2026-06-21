package com.haruon.groupware.application.schedule.required;

import com.haruon.groupware.application.schedule.service.query.response.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.response.ScheduleResponse;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ScheduleQueryRepository {

    List<Long> findScheduleParticipantsByScheduleId(Long scheduleId);

    Optional<Long> countScheduleParticipantsByScheduleId(Long scheduleId);

    List<ScheduleResponse> findSchedulesByParticipantEmpId(
            Long empId,
            LocalDateTime targetStart,
            LocalDateTime targetEnd,
            @Nullable ScheduleType scheduleType
    );

    Optional<ScheduleDetailResponse> findScheduleDetailsByIdAndEmpId(Long scheduleId, Long empId);
}
