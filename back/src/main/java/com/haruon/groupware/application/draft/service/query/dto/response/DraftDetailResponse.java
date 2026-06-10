package com.haruon.groupware.application.draft.service.query.dto.response;

import com.haruon.groupware.domain.draft.sub.LeaveType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

public record DraftDetailResponse(
        Long draftId,
        String draftType,
        EmpSummary drafter,
        String title,
        String content,
        @Nullable LocalDateTime submittedAt,
        String approvalStatus,
        List<DraftFileSummary> files,
        List<ApproverSummary> approvers,
        List<CirculationSummary> circulations,
        @Nullable Long sourceDraftId,
        @Nullable Long cancellationDraftId,
        @Nullable LocalDateTime cancellationSubmittedAt,
        @Nullable LeaveDraftDetail leave,
        @Nullable BusinessTripDraftDetail businessTrip,
        @Nullable SalesDraftDetail sales
) {
    public record EmpSummary(
            Long empId,
            String empName
    ) {
    }

    public record DraftFileSummary(
            Long fileId,
            String originalName,
            String mimeType,
            String extension,
            Long fileSize
    ) {
    }

    public record ApproverSummary(
            Long empId,
            String empName,
            String role,
            Integer order,
            @Nullable LocalDateTime approvedAt,
            @Nullable LocalDateTime rejectedAt,
            @Nullable String rejectReason
    ) {
    }

    public record CirculationSummary(
            Long empId,
            String empName,
            @Nullable LocalDateTime readAt
    ) {
    }

    public record LeaveDraftDetail(
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType,
            Long reservedHours
    ) {
    }

    public record BusinessTripDraftDetail(
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            List<EmpSummary> participants
    ) {
    }

    public record SalesDraftDetail(
            Long franchiseId,
            String franchiseName,
            YearMonth reportMonth,
            Long salesAmount
    ) {
    }
}
