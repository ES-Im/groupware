package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRoomRetriever;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/meeting-rooms")
@RequiredArgsConstructor
public class MeetingRoomApi {

    private final MeetingRoomRetriever meetingRoomRetriever;

    @GetMapping("/available")
    public ResponseEntity<Page<MeetingRoomResponse>> getAvailableMeetingRooms(
            @RequestParam LocalDate date,
            @RequestParam LocalTime startAt,
            @RequestParam LocalTime endAt,
            @RequestParam Integer capacity,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MeetingRoomResponse> responses = meetingRoomRetriever
                .retrieveMeetingRooms(date, startAt, endAt, capacity, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/management")
    public ResponseEntity<Page<MeetingRoomResponse>> getMeetingRoomsForManagement(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) Boolean bookedInFuture,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MeetingRoomResponse> responses = meetingRoomRetriever.retrieveMeetingRooms(
                details.getEmpId(), available, bookedInFuture, pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{meetingRoomId}/reservations")
    public ResponseEntity<List<ReservationsByRoomResponse>> getReservationsByRoom(
            @PathVariable Long meetingRoomId,
            @RequestParam(required = false) YearMonth yearMonth
    ) {
        List<ReservationsByRoomResponse> responses = meetingRoomRetriever
                .retrieveReservationsByRoomId(meetingRoomId, getTargetYearMonth(yearMonth));

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{meetingRoomId}")
    public ResponseEntity<MeetingRoomDetailResponse> getMeetingRoomDetail(
            @PathVariable Long meetingRoomId
    ) {
        MeetingRoomDetailResponse response = meetingRoomRetriever
                .retrieveMeetingRoomById(meetingRoomId);

        return ResponseEntity.ok().body(response);
    }


    @GetMapping("/{meetingRoomId}/files")
    public ResponseEntity<List<FileListInfo>> getFilesByRoom(
            @PathVariable Long meetingRoomId
    ) {
        List<FileListInfo> responses = meetingRoomRetriever
                .retrieveMeetingRoomFiles(meetingRoomId);

        return ResponseEntity.ok().body(responses);
    }

    private YearMonth getTargetYearMonth(YearMonth yearMonth) {
        return yearMonth == null
                ? YearMonth.now(SEOUL_ZONE)
                : yearMonth;
    }
}
