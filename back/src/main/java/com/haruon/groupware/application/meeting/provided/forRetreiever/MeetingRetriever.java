package com.haruon.groupware.application.meeting.provided.forRetreiever;

import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface MeetingRetriever {
    List<ReservationResponse> retrieveMyReservations(Long empId, YearMonth targetYearMonth);

    ReservationDetailResponse retrieveReservationByMeetingId(Long meetingId);

    Page<ReservationResponse> retrieveReservations(Long empId, YearMonth targetYearMonth, Pageable pageable);
}
