package com.haruon.groupware.application.meeting.required;

import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

public interface MeetingQueryRepository {
    List<ReservationResponse> findMeetingsByEmpId(
            Long empId, LocalDateTime start, LocalDateTime end
    );

    ReservationDetailResponse findMeetingById(Long meetingId);

    Page<ReservationResponse> findMeetings(
            YearMonth targetYearMonth,
            @Nullable String keyword,
            @Nullable Long meetingRoomId,
            Pageable pageable
    );
}
