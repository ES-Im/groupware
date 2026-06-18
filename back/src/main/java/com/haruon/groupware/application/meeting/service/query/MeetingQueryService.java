package com.haruon.groupware.application.meeting.service.query;

import com.haruon.groupware.application.exception.meeting.MeetingNotFoundException;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRetriever;
import com.haruon.groupware.application.meeting.required.MeetingQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
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
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public List<ReservationResponse> retrieveMyReservations(
            Long empId, YearMonth targetYearMonth
    ) {
        return meetingQueryRepository.findMeetingsByEmpId(empId, targetYearMonth);
    }

    @Override
    public ReservationDetailResponse retrieveReservationByMeetingId(Long meetingId) {
        ReservationDetailResponse response = meetingQueryRepository.findMeetingById(meetingId);
        if (response == null) throw new MeetingNotFoundException();
        return response;
    }

    @Override
    public Page<ReservationResponse> retrieveAllReservations(
            Long empId,
            YearMonth targetYearMonth,
            @Nullable String keyword,
            @Nullable Long meetingRoomId,
            Pageable pageable
    ) {
        AuthValidator.checkFacilityRoleEmp(authorizationQueryRepository, empId);

        return meetingQueryRepository.findMeetings(
                targetYearMonth, keyword, meetingRoomId, pageable
        );
    }
}
