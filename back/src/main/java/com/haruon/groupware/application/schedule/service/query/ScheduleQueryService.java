package com.haruon.groupware.application.schedule.service.query;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.schedule.ScheduleNotFoundException;
import com.haruon.groupware.application.schedule.provided.forRetriever.ScheduleRetriever;
import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleResponse;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleQueryService implements ScheduleRetriever {

    private final ScheduleQueryRepository scheduleQueryRepository;

    @Override
    public List<ScheduleResponse> retrieveSchedules(
            Long empId,
            LocalDateTime targetStart,
            LocalDateTime targetEnd,
            @Nullable ScheduleType scheduleType
    ) {
        if(targetEnd.isBefore(targetStart)) throw new EndTimeBeforeStartTimeException();

        return scheduleQueryRepository.findSchedulesByParticipantEmpId(
                empId, targetStart, targetEnd, scheduleType
        );
    }

    @Override
    public ScheduleDetailResponse retrieveSchedule(
            Long empId,
            Long scheduleId
    ) {
        return scheduleQueryRepository
                .findScheduleDetailsByIdAndEmpId(scheduleId, empId)
                .orElseThrow(ScheduleNotFoundException::new);
    }
}
