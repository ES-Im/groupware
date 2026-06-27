package com.haruon.groupware.application.file.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.file.FileValidator;
import com.haruon.groupware.application.file.service.support.FileDomain;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.Set;

@Builder
public record MeetingRoomFileUploadRequest(
        @NotNull Long editorId,
        @NotNull Long meetingRoomId,

        @NotNull FileDto file

) implements FileUploadRequest {

    @Override
    public FileDomain domain() {
        return FileDomain.MEETING_ROOM;
    }

    private static final long FILE_SIZE_MAX = 10 * 1024 * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );

    public MeetingRoomFileUploadRequest {
        if(meetingRoomId == null || file == null) throw new RequiredValueMissingException();

        FileValidator.validate(file, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIZE_MAX);
    }

    public static MeetingRoomFileUploadRequest toMeetingRoomFileUploadRequest(Long editorId, Long meetingRoomId, FileDto file) {
        return new MeetingRoomFileUploadRequest(editorId, meetingRoomId, file);
    }
}
