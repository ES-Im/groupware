package com.haruon.groupware.application.meeting.service.query;

import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRetriever;
import com.haruon.groupware.application.meeting.required.MeetingQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingQueryService implements MeetingRetriever {

    private final MeetingQueryRepository meetingQueryRepository;

    @Override
    public List<ReservationResponse> retrieveMyReservations(
            Long empId, YearMonth targetYearMonth
    ) {
        return List.of();
    }

    @Override
    public ReservationDetailResponse retrieveReservationByMeetingId(Long meetingId) {
        return null;
    }

    @Override
    public Page<ReservationResponse> retrieveReservations(Long empId, YearMonth targetYearMonth, Pageable pageable) {
        return null;
    }
}
