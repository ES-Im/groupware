package com.haruon.groupware.application.file.service.query;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.service.query.dto.FileResourceInfo;
import com.haruon.groupware.application.file.service.support.FileDomain;
import org.springframework.stereotype.Service;

@Service
public class MeetingRoomFileResourceService extends AbstractFileResourceService {

    @Override
    public FileDomain domain() {
        return FileDomain.MEETING_ROOM;
    }

    public MeetingRoomFileResourceService(
            FileResourceQueryRepository fileResourceQueryRepository,
            FileStorage fileStorage
    ) {
        super(fileResourceQueryRepository, fileStorage);
    }

    @Override
    protected FileResourceInfo getFileResourceInfo(Long roomId, Long fileId) {
        return fileResourceQueryRepository
                .findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(roomId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }

}
