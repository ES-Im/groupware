package com.haruon.groupware.application.meeting.service.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.file.FileDto;
import com.haruon.groupware.application.utils.file.FileValidator;
import lombok.Builder;

import java.util.Set;

@Builder
public record MeetingRoomFileCreateRequest(
        Long meetingRoomId,
        Long editorId,

        FileDto file

) {
    private static final long FILE_SIZE_MAX = 10 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );

    public MeetingRoomFileCreateRequest {
        if(meetingRoomId == null || file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }
}
