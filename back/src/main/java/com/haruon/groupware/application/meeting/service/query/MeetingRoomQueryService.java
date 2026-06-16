package com.haruon.groupware.application.meeting.service.query;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRoomRetriever;
import com.haruon.groupware.application.meeting.required.MeetingRoomQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingRoomQueryService implements MeetingRoomRetriever {

    private final MeetingRoomQueryRepository meetingRoomQueryRepository;

    @Override
    public Page<MeetingRoomResponse> retrieveMeetingRooms(LocalDate date, LocalTime startAt, LocalTime endAt, Integer capacity, Pageable pageable) {
        return null;
    }

    @Override
    public Page<MeetingRoomResponse> retrieveMeetingRooms(Long empId, @Nullable Boolean available, @Nullable Boolean bookedInFuture, Pageable pageable) {
        return null;
    }

    @Override
    public List<ReservationsByRoomResponse> retrieveReservationsByRoomId(Long meetingRoomId, YearMonth targetYearMonth) {
        return List.of();
    }

    @Override
    public MeetingRoomDetailResponse retrieveMeetingRoomById(Long meetingRoomId) {
        return null;
    }

    @Override
    public List<FileListInfo> retrieveMeetingRoomFiles(Long meetingRoomId) {
        return List.of();
    }
}
