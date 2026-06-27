package com.haruon.groupware.adapter.webapi.schedule;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.schedule.provided.forCommand.ScheduleManagement;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleCreateRequest;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedules")
public class ScheduleCommandApi {

    private final ScheduleManagement scheduleManagement;

    @PostMapping
    public ResponseEntity<SourceKeyResponse> registerManualSchedule(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid ManualScheduleCreateRequest request
    ) {
        String sourceKey = scheduleManagement.registerSchedules(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new SourceKeyResponse(sourceKey));
    }

    @PostMapping("/{scheduleId}/participants")
    public ResponseEntity<Void> addScheduleParticipants(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long scheduleId,
            @RequestParam(defaultValue = "SINGLE") Scope scope,
            @RequestBody @Valid TargetParticipants request
    ) {
        scheduleManagement.addParticipants(scheduleId, details.getEmpId(), request.participantIds(), scope.isForBulkEdit());

        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{scheduleId}/participants")
    public ResponseEntity<Void> removeScheduleParticipants(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long scheduleId,
            @RequestParam(defaultValue = "SINGLE") Scope scope,
            @RequestBody @Valid TargetParticipants request
    ) {
        scheduleManagement.removeParticipants(scheduleId, details.getEmpId(), request.participantIds(), scope.isForBulkEdit());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{scheduleId}/cancellation")
    public ResponseEntity<Void> cancelSchedules(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long scheduleId,
            @RequestParam(defaultValue = "SINGLE") Scope scope
    ) {
        scheduleManagement.cancelSchedule(scheduleId, details.getEmpId(), scope.isForBulkEdit());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{scheduleId}")
    public ResponseEntity<Void> updateSchedulesInfo(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long scheduleId,
            @RequestParam(defaultValue = "SINGLE") Scope scope,
            @RequestBody @Valid ManualScheduleUpdateRequest request
    ) {
        scheduleManagement.updateManualSchedule(scheduleId, details.getEmpId(), scope.isForBulkEdit(), request);

        return ResponseEntity.status(204).build();
    }

    public record SourceKeyResponse(
            String sourceKey
    ) {}

    public record TargetParticipants(
            @NotEmpty Set<@NotNull Long> participantIds
    ) {}

}
