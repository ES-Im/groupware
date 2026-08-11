package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.DateSupport;
import com.haruon.groupware.adapter.webapi.RegisterDomainIdResponse;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.meeting.DateValueRequiredException;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.provided.forRetriever.MeetingRoomRetriever;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static com.haruon.groupware.adapter.webapi.DateSupport.resolveSearchPeriod;

@RestController
@RequestMapping("/api/meeting-rooms")
@RequiredArgsConstructor
public class MeetingRoomApi {

    private final MeetingRoomRetriever meetingRoomRetriever;
    private final MeetingRoomManagement meetingRoomManagement;

    @GetMapping("/available")   // 예약조건에 맞는 회의실 조회
    public ResponseEntity<Page<MeetingRoomResponse>> getAvailableMeetingRooms(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) LocalTime startAt,
            @RequestParam(required = false) LocalTime endAt,
            @RequestParam(required = false) Integer capacity,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        boolean anyDateTimeProvided = date != null || startAt != null || endAt != null;
        boolean allDateTimeProvided = date != null && startAt != null && endAt != null;
        if(anyDateTimeProvided && !allDateTimeProvided) throw new DateValueRequiredException();

        if(startAt != null && endAt != null && !endAt.isAfter(startAt)) throw new EndTimeBeforeStartTimeException();
        if(capacity != null && capacity <= 0) throw new PositiveValueRequiredException();

        Page<MeetingRoomResponse> responses = meetingRoomRetriever
                .retrieveAvailableMeetingRooms(date, startAt, endAt, capacity, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/management")  // 시설 담당자용 회의실 조회
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

    @GetMapping("/{meetingRoomId}/reservations/calendar")
    public ResponseEntity<List<ReservationsByRoomResponse>> getReservationsByRoom(
            @PathVariable Long meetingRoomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        DateSupport.SearchPeriod searchPeriod = resolveSearchPeriod(start, end);

        List<ReservationsByRoomResponse> responses = meetingRoomRetriever
                .retrieveReservationsByRoomId(meetingRoomId, searchPeriod.startDateTime(), searchPeriod.endDateTime());

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

    @PostMapping
    public ResponseEntity<RegisterDomainIdResponse> createRoom(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid MeetingRoomCreateRequest request
    ) {
        long meetingRoomId = meetingRoomManagement.createMeetingRoom(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new RegisterDomainIdResponse(meetingRoomId));
    }

    @PatchMapping("/{meetingRoomId}")
    public ResponseEntity<Void> changeInfo(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingRoomId,
            @RequestBody @Valid MeetingRoomUpdateRequest request
    ) {
        meetingRoomManagement.changeRoomInfo(meetingRoomId, details.getEmpId(), request);

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{meetingRoomId}/activate")
    public ResponseEntity<Void> activateMeetingRoom(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingRoomId
    ) {
        meetingRoomManagement.activate(meetingRoomId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{meetingRoomId}/deactivate")
    public ResponseEntity<Void> deactivateMeetingRoom(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingRoomId
    ) {
        meetingRoomManagement.deactivate(meetingRoomId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }


}
