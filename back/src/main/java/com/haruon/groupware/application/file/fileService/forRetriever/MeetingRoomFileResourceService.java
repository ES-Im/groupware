package com.haruon.groupware.application.file.fileService.forRetriever;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
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

    protected FileResourceInfo getFileResourceInfo(Long roomId, Long fileId) {
        return fileResourceQueryRepository
                .findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(roomId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }

}
