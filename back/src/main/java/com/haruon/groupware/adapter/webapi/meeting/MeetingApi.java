package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.exception.meeting.MeetingParticipantRequiredException;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingManagement;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRetriever;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingUpdateRequest;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingApi {

    private final MeetingRetriever meetingRetriever;
    private final MeetingManagement meetingManagement;

    @GetMapping("/my/reservations/calendar")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) YearMonth yearMonth
    ) {
        List<ReservationResponse> responses = meetingRetriever
                .retrieveMyReservations(details.getEmpId(), getTargetYearMonth(yearMonth));

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{meetingId}")
    public ResponseEntity<ReservationDetailResponse> getReservationResponse(
            @PathVariable Long meetingId
    ) {
        // TODO: 참여자 정보가 포함되므로 예약자/참여자/시설 담당자만 조회하도록 서비스 권한 검증이 필요
        ReservationDetailResponse response = meetingRetriever
                .retrieveReservationByMeetingId(meetingId);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping
    public ResponseEntity<Page<ReservationResponse>> getAllReservations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) YearMonth yearMonth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long meetingRoomId,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<ReservationResponse> responses = meetingRetriever.retrieveAllReservations(
                details.getEmpId(), getTargetYearMonth(yearMonth), keyword, meetingRoomId, pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    @PostMapping
    public ResponseEntity<Void> reserveMeetings(
            @RequestBody @Valid MeetingReserveRequest request
    ) {
        meetingManagement.reserve(request);

        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{meetingId}/participants")
    public ResponseEntity<Void> replaceParticipants(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingId,
            @RequestBody ParticipantReplaceRequest request
    ) {
        if(request.participantIds() == null || request.participantIds().isEmpty()) {
            throw new MeetingParticipantRequiredException();
        }

        meetingManagement.replaceParticipants(
                meetingId, details.getEmpId(), request.participantIds()
        );

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{meetingId}/cancel")
    public ResponseEntity<Void> cancelMeeting(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingId
    ) {
        meetingManagement.cancelMeeting(meetingId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{meetingId}/reservation-info")
    public ResponseEntity<Void> changeReservationInfo(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingId,
            @RequestBody @Valid MeetingUpdateRequest request
    ) {
        meetingManagement.changeReservationInfo(meetingId, details.getEmpId(), request);

        return ResponseEntity.status(204).build();
    }

    private YearMonth getTargetYearMonth(YearMonth yearMonth) {
        return yearMonth == null
                ? YearMonth.now(SEOUL_ZONE)
                : yearMonth;
    }

    public record ParticipantReplaceRequest(
            Set<Long> participantIds
    ) {}

}
