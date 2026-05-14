package com.haruon.groupware.application.meeting.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.meeting.MeetingNotFoundException;
import com.haruon.groupware.application.exception.meeting.MeetingRoomNotFoundException;
import com.haruon.groupware.application.meeting.provided.MeetingManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.meeting.service.MeetingRoomService.findActiveMeetingRoom;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;

/**
 * 모든 메서드 도메인 이벤트 발행 필요, 테스트시 save -> 이벤트 발행 -> empty까지 확인할 것
 */

@Slf4j
@Transactional
@Service
@RequiredArgsConstructor
public class MeetingService implements MeetingManagement {

    private final EmpRepository empRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingRoomRepository meetingRoomRepository;

    @Override
    public long reserve(MeetingReserveRequest request) {
        MeetingRoom room = findActiveMeetingRoom(meetingRoomRepository, request.meetingRoomId());
        Emp reserver = findActiveEmpById(empRepository, request.reserverId());
        List<Emp> participants = findEmpListById(empRepository, request.participantIds());

        Meeting reservedMeeting = Meeting.reserve(
                room, reserver, request.title(), request.meetingDate(), request.startAt(), request.endAt(), participants
        );
        log.info("save 전 이벤트 수 = {}", reservedMeeting.domainEvents().size());
        return meetingRepository.save(reservedMeeting).getId();
    }

    @Override
    public void replaceParticipants(long meetingId, long reserverId, Set<Long> participantIds) {
        Meeting meeting = findMeetingByIdAndReserverId(meetingId, reserverId);

        log.info("request participantIds={}", participantIds); // request participantIds=[3329, 3330, 3331]

        List<Emp> participants = findEmpListById(empRepository, participantIds);

        log.info("found participantIds={}",
                participants.stream().map(Emp::getId).toList());    // found participantIds=[3329, 3330, 3331]

        log.info("before meeting participantIds={}",
                meeting.getMeetingParticipants().stream()   //  before meeting participantIds=[3330, 3329]
                        .map(mp -> mp.getEmp().getId())
                        .toList());

        meeting.changeParticipants(participants);

        log.info("after meeting participantIds={}",
                meeting.getMeetingParticipants().stream()
                        .map(mp -> mp.getEmp().getId())
                        .toList()); // after meeting participantIds=[3330, 3329, 3331]

        meetingRepository.save(meeting);
    }

    @Override
    public void cancelMeeting(long meetingId, long reserverId) {
        Meeting meeting = findMeetingByIdAndReserverId(meetingId, reserverId);
        meeting.cancel();
        log.info("회의 취소 - save 전 이벤트 수 = {}", meeting.domainEvents().size());

        meetingRepository.save(meeting);
    }

    @Override
    public void changeReservationInfo(MeetingUpdateRequest request) {
        Meeting meeting = findMeetingByIdAndReserverId(request.meetingId(), request.reserverId());
        MeetingRoom meetingRoom = null;

        if(request.meetingRoomId() != null) {
            meetingRoom = findActiveMeetingRoom(meetingRoomRepository, request.meetingRoomId());
        }

        meeting.changeReservationInfo(
                request.meetingDate(),
                request.startAt(),
                request.endAt(),
                meetingRoom,
                request.title()
        );
    }

    static List<Meeting> findReservedMeeting(
            MeetingRepository meetingRepository
            , MeetingRoomRepository meetingRoomRepository
            , long roomId
    ) {
        LocalDate now = LocalDate.now(ZoneId.systemDefault());

        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(MeetingRoomNotFoundException::new);

        return meetingRepository.findMeetingByMeetingDateAfterAndMeetingRoom(now, room);
    }

    private Meeting findMeetingByIdAndReserverId(long meetingId, long reserverId) {
        return meetingRepository.findByIdAndEmpId(meetingId, reserverId)
                .orElseThrow(MeetingNotFoundException::new);
    }


}
