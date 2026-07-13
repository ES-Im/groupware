package com.haruon.groupware.application.meeting.provided.forRetriever;

import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public interface MeetingRoomRetriever {

    Page<MeetingRoomResponse> retrieveAvailableMeetingRooms(
            @Nullable LocalDate date,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            @Nullable Integer capacity,
            Pageable pageable
    );

    Page<MeetingRoomResponse> retrieveMeetingRooms(
            Long empId,
            @Nullable Boolean available,
            @Nullable Boolean bookedInFuture,
            Pageable pageable
    );


    List<ReservationsByRoomResponse> retrieveReservationsByRoomId(
            Long meetingRoomId, LocalDateTime start, LocalDateTime end
    );

    MeetingRoomDetailResponse retrieveMeetingRoomById(Long meetingRoomId);

    List<FileListInfo> retrieveMeetingRoomFiles(Long meetingRoomId);
}
