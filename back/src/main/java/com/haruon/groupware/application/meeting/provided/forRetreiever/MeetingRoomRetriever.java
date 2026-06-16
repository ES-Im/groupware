package com.haruon.groupware.application.meeting.provided.forRetreiever;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

public interface MeetingRoomRetriever {

    Page<MeetingRoomResponse> retrieveMeetingRooms(
            LocalDate date, LocalTime startAt, LocalTime endAt, Integer capacity, Pageable pageable
    );

    Page<MeetingRoomResponse> retrieveMeetingRooms(
            Long empId, @Nullable Boolean available, @Nullable Boolean bookedInFuture, Pageable pageable
    );


    List<ReservationsByRoomResponse> retrieveReservationsByRoomId(Long meetingRoomId, YearMonth targetYearMonth);

    MeetingRoomDetailResponse retrieveMeetingRoomById(Long meetingRoomId);

    List<FileListInfo> retrieveMeetingRoomFiles(Long meetingRoomId);
}
