package com.haruon.groupware.application.meeting.provided.forRetriever;

import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

public interface MeetingRetriever {
    List<ReservationResponse> retrieveMyReservations(
            Long empId, LocalDateTime start, LocalDateTime end);

    ReservationDetailResponse retrieveReservationByMeetingId(Long meetingId);

    Page<ReservationResponse> retrieveAllReservations(
            Long empId,
            YearMonth targetYearMonth,
            @Nullable String keyword,
            @Nullable Long meetingRoomId,
            Pageable pageable
    );
}
