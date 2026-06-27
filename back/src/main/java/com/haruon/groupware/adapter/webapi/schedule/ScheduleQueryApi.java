package com.haruon.groupware.adapter.webapi.schedule;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.DateSupport;
import com.haruon.groupware.application.schedule.provided.forRetriever.ScheduleRetriever;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleResponse;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.adapter.webapi.DateSupport.resolveSearchPeriod;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedules")
public class ScheduleQueryApi {

    private final ScheduleRetriever scheduleRetriever;

    @GetMapping("/calendar")
    public ResponseEntity<List<ScheduleResponse>> getSchedules(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) ScheduleType scheduleType
    ) {
        DateSupport.SearchPeriod searchPeriod = resolveSearchPeriod(start, end);

        List<ScheduleResponse> responses = scheduleRetriever
                .retrieveSchedules(details.getEmpId(), searchPeriod.startDateTime(), searchPeriod.endDateTime(), scheduleType);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<ScheduleDetailResponse> getSchedule(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long scheduleId
    ) {
        ScheduleDetailResponse response = scheduleRetriever
                .retrieveSchedule(details.getEmpId(), scheduleId);

        return ResponseEntity.ok().body(response);
    }

}
