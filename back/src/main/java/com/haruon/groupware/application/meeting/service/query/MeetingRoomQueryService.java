package com.haruon.groupware.application.meeting.service.query;

import com.haruon.groupware.application.exception.meeting.MeetingRoomNotFoundException;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRoomRetriever;
import com.haruon.groupware.application.meeting.required.MeetingRoomQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingRoomQueryService implements MeetingRoomRetriever {

    private final MeetingRoomQueryRepository meetingRoomQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public Page<MeetingRoomResponse> retrieveAvailableMeetingRooms(
            LocalDate date,
            LocalTime startAt,
            LocalTime endAt,
            Integer capacity,
            Pageable pageable
    ) {
        return meetingRoomQueryRepository.findAvailableMeetingRooms(
                date, startAt, endAt, capacity, pageable
        );
    }

    @Override
    public Page<MeetingRoomResponse> retrieveMeetingRooms(
            Long empId,
            @Nullable Boolean available,
            @Nullable Boolean bookedInFuture,
            Pageable pageable
    ) {
        AuthValidator.checkFacilityRoleEmp(authorizationQueryRepository, empId);

        LocalDateTime now = LocalDateTime.now(SEOUL_ZONE);

        return meetingRoomQueryRepository.findMeetingRooms(
                available, bookedInFuture, now, pageable
        );
    }

    // 회의 예약자정보, 참여자 예약자 정보 외 n인으로 표시, 예약시간, 스케쥴만 출력 자세한 내용은 x
    @Override
    public List<ReservationsByRoomResponse> retrieveReservationsByRoomId(
            Long meetingRoomId, YearMonth targetYearMonth
    ) {
        return meetingRoomQueryRepository.findMeetingsByMeetingRoomId(
                meetingRoomId, targetYearMonth
        );
    }

    @Override
    public MeetingRoomDetailResponse retrieveMeetingRoomById(Long meetingRoomId) {
        MeetingRoomDetailResponse response = meetingRoomQueryRepository.findMeetingRoomById(meetingRoomId);
        if (response == null) throw new MeetingRoomNotFoundException();
        return response;
    }

    @Override
    public List<FileListInfo> retrieveMeetingRoomFiles(Long meetingRoomId) {
        return meetingRoomQueryRepository.findMeetingRoomFilesById(meetingRoomId);
    }
}
