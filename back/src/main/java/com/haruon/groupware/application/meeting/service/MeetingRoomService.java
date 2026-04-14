package com.haruon.groupware.application.meeting.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.meeting.provided.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomFileCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.meeting.MeetingRoomFile;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.haruon.groupware.application.meeting.service.MeetingService.findReservedMeeting;
import static com.haruon.groupware.application.utils.Utils.checkAdminById;
import static io.jsonwebtoken.lang.Assert.state;

@Transactional
@Service
@RequiredArgsConstructor
public class MeetingRoomService implements MeetingRoomManagement {

    private final EmpRepository empRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingRoomRepository meetingRoomRepository;


    @Override
    public void createMeetingRoom(MeetingRoomCreateRequest request) {
        validateEditor(request);

        MeetingRoom room = MeetingRoom.createMeetingRoom(
                request.name(), request.description(), request.capacity()
        );

        meetingRoomRepository.save(room);
    }

    @Override
    public void changeRoomInfo(MeetingRoomUpdateRequest request) {
        isEditable(request.roomId());

        checkAdminById(empRepository, request.adminId());

        MeetingRoom room = findMeetingRoom(meetingRoomRepository, request.roomId());

        room.changeRoomInfo(
                request.name(), request.description(), request.capacity()
        );
    }

    @Override
    public void activate(Long roomId, Long adminId) {
        isEditable(roomId);
        checkAdminById(empRepository, adminId);

        MeetingRoom room = findMeetingRoom(meetingRoomRepository, roomId);
        state(room.isAvailable(), "이미 활성화된 회의실");

        room.activate();

    }

    @Override
    public void deactivate(Long roomId, Long adminId) {
        isEditable(roomId);
        checkAdminById(empRepository, adminId);

        MeetingRoom room = findMeetingRoom(meetingRoomRepository, roomId);
        state(!room.isAvailable(), "이미 비활성화된 회의실");

        room.deactivate();
    }

    @Override
    public void addRoomFile(MeetingRoomFileCreateRequest request) {
        checkAdminById(empRepository, request.editorId());

        MeetingRoom room = findMeetingRoom(meetingRoomRepository, request.meetingRoomId());
        FileDto file = request.file();

        room.addRoomFile(
                file.mimeType(), file.originalFileName(), file.extension(), file.fileSize()
        );
    }

    @Override
    public void removeRoomFile(Long roomId, Long editorId, Long fileId) {
        checkAdminById(empRepository, editorId);

        MeetingRoom room = findMeetingRoom(meetingRoomRepository, roomId);
        MeetingRoomFile file = room.getRoomFiles().stream()
                .filter(f -> f.getId().equals(fileId)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 파일이 없음"));

        room.removeRoomFile(file);
    }

    static MeetingRoom findMeetingRoom(MeetingRoomRepository repository, Long roomId) {
        return repository.findById(roomId).filter(MeetingRoom::isAvailable)
                .orElseThrow(() -> new IllegalArgumentException("조회된 활성화 회의실이 없음"));
    }


    private void validateEditor(MeetingRoomCreateRequest request) {
        checkAdminById(empRepository, request.editor());
    }

    private void isEditable(long roomId) {
        List<Meeting> reserved = findReservedMeeting(meetingRepository, meetingRoomRepository, roomId);

        state(reserved.isEmpty(), "미래에 예약된 회의가 있어 회의실 정보 수정 불가");
    }

}
