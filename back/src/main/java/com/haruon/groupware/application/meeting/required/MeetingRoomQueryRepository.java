package com.haruon.groupware.application.meeting.required;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

public interface MeetingRoomQueryRepository {
    Page<MeetingRoomResponse> findAvailableMeetingRooms(
            LocalDate date, LocalTime startAt, LocalTime endAt, Integer capacity, Pageable pageable
    );


    Page<MeetingRoomResponse> findMeetingRooms(
            @Nullable Boolean available,
            @Nullable Boolean bookedInFuture,
            LocalDateTime now,
            Pageable pageable
    );

    List<ReservationsByRoomResponse> findMeetingsByMeetingRoomId(
            Long meetingRoomId,
            YearMonth targetYearMonth
    );

    MeetingRoomDetailResponse findMeetingRoomById(Long meetingRoomId);

    List<FileListInfo> findMeetingRoomFilesById(Long meetingRoomId);
}
