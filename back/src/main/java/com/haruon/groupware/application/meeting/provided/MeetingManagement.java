package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingUpdateRequest;

/**
 * 회의 예약/취소/정보수정을 담당하는 포트
 */
public interface MeetingManagement {
    void reserve(MeetingReserveRequest request);

    void addParticipant(long meetingId, long reserverId, long participantId);

    void removeParticipant(long meetingId, long reserverId, long participantId);

    void cancelMeeting(long meetingId, long reserverId);

    void changeReservationInfo(MeetingUpdateRequest request);


}
