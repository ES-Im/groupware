package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.exception.meeting.MeetingRoomNotFoundException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.request.MeetingRoomFileUploadRequest;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.utils.AuthorizationChecker.checkFacilityRoleEmp;

@Service
public class MeetingRoomFileManagerService extends AbstractFileManagerService<MeetingRoomFileUploadRequest> {

    private final MeetingRoomRepository meetingRoomRepository;
    private final EmpRepository empRepository;

    @Override
    public FileDomain domain() {
        return FileDomain.MEETING_ROOM;
    }

    public MeetingRoomFileManagerService(
            FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
            FileStorage fileStorage,
            MeetingRoomRepository meetingRoomRepository,
            EmpRepository empRepository
    ) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.meetingRoomRepository = meetingRoomRepository;
        this.empRepository = empRepository;
    }

    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository
                .findMeetingRoomFilePathInfoByStoredPath(request.domainPkId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();
        validateEditor(request.requesterEmpId());

        MeetingRoom room = findRoomById(request.domainPkId());

        room.removeRoomFile(request.fileId());
    }

    @Override
    protected void saveFileMetaData(MeetingRoomFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        if(uploadRequest == null || storedInfo == null) throw new RequiredValueMissingException();
        validateEditor(uploadRequest.editorId());

        MeetingRoom room = findRoomById(uploadRequest.meetingRoomId());
        FileDto file = uploadRequest.file();

        room.addRoomFile(
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath()
        );
    }

    private void validateEditor(Long empId) {
        checkFacilityRoleEmp(empRepository, empId);
    }

    private MeetingRoom findRoomById(Long roomId) {
        if(roomId == null) throw new RequiredValueMissingException();

        return meetingRoomRepository.findById(roomId)
                .orElseThrow(MeetingRoomNotFoundException::new);
    }

}
