package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingUpdateRequest;

import java.util.Set;

/**
 * 회의 예약/취소/정보수정을 담당하는 포트
 */
public interface MeetingManagement {
    void reserve(MeetingReserveRequest request);

    void replaceParticipants(long meetingId, long reserverId, Set<Long> participantIds);

    void cancelMeeting(long meetingId, long reserverId);

    void changeReservationInfo(MeetingUpdateRequest request);


}
