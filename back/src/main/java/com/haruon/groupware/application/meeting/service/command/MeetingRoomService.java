package com.haruon.groupware.application.meeting.service.command;

import com.haruon.groupware.application.exception.meeting.InactivatedMeetingRoomException;
import com.haruon.groupware.application.exception.meeting.MeetingRoomNotFoundException;
import com.haruon.groupware.application.exception.meeting.ReservedMeetingExistException;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.haruon.groupware.application.meeting.service.command.MeetingService.findReservedMeeting;
import static com.haruon.groupware.application.utils.AuthValidator.checkFacilityRoleEmp;

@Transactional
@Service
@RequiredArgsConstructor
public class MeetingRoomService implements MeetingRoomManagement {

    private final AuthorizationQueryRepository authorizationQueryRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingRoomRepository meetingRoomRepository;

    @Override
    public long createMeetingRoom(Long editorId, MeetingRoomCreateRequest request) {
        checkFacilityRoleEmp(authorizationQueryRepository, editorId);

        MeetingRoom room = MeetingRoom.createMeetingRoom(
                request.name(), request.description(), request.capacity()
        );

        return meetingRoomRepository.save(room).getId();
    }

    @Override
    public void changeRoomInfo(Long roomId, Long editorId, MeetingRoomUpdateRequest request) {
        isEditable(roomId);
        checkFacilityRoleEmp(authorizationQueryRepository, editorId);

        MeetingRoom room = findActiveMeetingRoom(meetingRoomRepository, roomId);

        room.changeRoomInfo(
                request.name(), request.description(), request.capacity()
        );
    }

    @Override
    public void activate(Long roomId, Long editorId) {
        checkFacilityRoleEmp(authorizationQueryRepository, editorId);

        MeetingRoom room = findMeetingRoom(roomId);

        room.activate();
    }


    @Override
    public void deactivate(Long roomId, Long editorId) {
        isEditable(roomId);
        checkFacilityRoleEmp(authorizationQueryRepository, editorId);

        MeetingRoom room = findActiveMeetingRoom(meetingRoomRepository, roomId);

        room.deactivate();
    }


    static MeetingRoom findActiveMeetingRoom(MeetingRoomRepository repository, Long roomId) {
        return repository.findById(roomId).filter(MeetingRoom::isAvailable)
                .orElseThrow(InactivatedMeetingRoomException::new);
    }

    private MeetingRoom findMeetingRoom(Long roomId) {
        return meetingRoomRepository.findById(roomId)
                .orElseThrow(MeetingRoomNotFoundException::new);
    }

    private void isEditable(long roomId) {
        List<Meeting> reserved = findReservedMeeting(meetingRepository, meetingRoomRepository, roomId);

        if(!reserved.isEmpty())
            throw new ReservedMeetingExistException();
    }

}
