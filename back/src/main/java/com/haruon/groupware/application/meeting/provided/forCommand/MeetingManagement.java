package com.haruon.groupware.application.meeting.provided.forCommand;

import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingUpdateRequest;

import java.util.Set;

/**
 * 회의 예약/취소/정보수정을 담당하는 포트
 */
public interface MeetingManagement {
    long reserve(MeetingReserveRequest request);

    void replaceParticipants(long meetingId, long reserverId, Set<Long> participantIds);

    void cancelMeeting(long meetingId, long reserverId);

    void changeReservationInfo(MeetingUpdateRequest request);


}
