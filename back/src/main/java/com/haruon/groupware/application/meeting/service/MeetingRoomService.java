package com.haruon.groupware.application.meeting.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.exception.meeting.InactivatedMeetingRoomException;
import com.haruon.groupware.application.exception.meeting.MeetingRoomNotFoundException;
import com.haruon.groupware.application.exception.meeting.ReservedMeetingExistException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.meeting.provided.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomFileCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.meeting.MeetingRoomFile;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.haruon.groupware.application.meeting.service.MeetingService.findReservedMeeting;
import static com.haruon.groupware.application.utils.AuthorizationChecker.checkFacilityRoleEmp;

@Transactional
@Service
@RequiredArgsConstructor
public class MeetingRoomService implements MeetingRoomManagement {

    private final EmpRepository empRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingRoomRepository meetingRoomRepository;
    private final FileStorage fileStorage;

    private static final String MEETING_ROOM_FILE_TYPE = "meeting-room";

    @Override
    public long createMeetingRoom(MeetingRoomCreateRequest request) {
        checkFacilityRoleEmp(empRepository, request.editorId());

        MeetingRoom room = MeetingRoom.createMeetingRoom(
                request.name(), request.description(), request.capacity()
        );

        return meetingRoomRepository.save(room).getId();
    }

    @Override
    public void changeRoomInfo(MeetingRoomUpdateRequest request) {
        isEditable(request.roomId());
        checkFacilityRoleEmp(empRepository, request.editorId());

        MeetingRoom room = findActiveMeetingRoom(meetingRoomRepository, request.roomId());

        room.changeRoomInfo(
                request.name(), request.description(), request.capacity()
        );
    }

    @Override
    public void activate(Long roomId, Long editorId) {
        checkFacilityRoleEmp(empRepository, editorId);

        MeetingRoom room = findMeetingRoom(roomId);

        room.activate();
    }


    @Override
    public void deactivate(Long roomId, Long editorId) {
        isEditable(roomId);
        checkFacilityRoleEmp(empRepository, editorId);

        MeetingRoom room = findActiveMeetingRoom(meetingRoomRepository, roomId);

        room.deactivate();
    }

    @Override
    public void addRoomFile(MeetingRoomFileCreateRequest request) {
        checkFacilityRoleEmp(empRepository, request.editorId());

        MeetingRoom room = findMeetingRoom(request.meetingRoomId());
        FileDto file = request.file();
        StoreFile storedFile = fileStorage.store(file, MEETING_ROOM_FILE_TYPE);

        room.addRoomFile(
                storedFile.mimeType(),
                storedFile.originalName(),
                storedFile.storedName(),
                storedFile.extension(),
                storedFile.fileSize(),
                storedFile.storedPath()
        );
    }

    @Override
    public void removeRoomFile(Long roomId, Long editorId, Long fileId) {
        checkFacilityRoleEmp(empRepository, editorId);

        MeetingRoom room = findMeetingRoom(roomId);
        MeetingRoomFile file = findRoomFile(fileId, room);

        room.removeRoomFile(file);
    }


    static MeetingRoom findActiveMeetingRoom(MeetingRoomRepository repository, Long roomId) {
        return repository.findById(roomId).filter(MeetingRoom::isAvailable)
                .orElseThrow(InactivatedMeetingRoomException::new);
    }

    private MeetingRoom findMeetingRoom(Long roomId) {
        return meetingRoomRepository.findById(roomId)
                .orElseThrow(MeetingRoomNotFoundException::new);
    }

    private MeetingRoomFile findRoomFile(Long fileId, MeetingRoom room) {
        return room.getRoomFiles().stream()
                .filter(f -> f.getId().equals(fileId)).findFirst()
                .orElseThrow(FileNotFoundException::new);
    }

    private void isEditable(long roomId) {
        List<Meeting> reserved = findReservedMeeting(meetingRepository, meetingRoomRepository, roomId);

        if(!reserved.isEmpty())
            throw new ReservedMeetingExistException();
    }

}
