package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRetriever;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingApi {

    private final MeetingRetriever meetingRetriever;

    @GetMapping("/my/reservations")
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
        ReservationDetailResponse response = meetingRetriever
                .retrieveReservationByMeetingId(meetingId);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping
    public ResponseEntity<Page<ReservationResponse>> getReservations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) YearMonth yearMonth,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<ReservationResponse> responses = meetingRetriever
                .retrieveReservations(details.getEmpId(), getTargetYearMonth(yearMonth), pageable);

        return ResponseEntity.ok().body(responses);
    }

    private YearMonth getTargetYearMonth(YearMonth yearMonth) {
        return yearMonth == null
                ? YearMonth.now(SEOUL_ZONE)
                : yearMonth;
    }
}
