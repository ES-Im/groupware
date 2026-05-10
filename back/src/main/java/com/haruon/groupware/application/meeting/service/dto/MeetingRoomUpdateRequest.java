package com.haruon.groupware.application.meeting.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;


@Builder
public record MeetingRoomUpdateRequest (
        Long roomId,
        Long editorId,

        @Nullable String name,
        @Nullable String description,
        @Nullable Integer capacity
) {
    public MeetingRoomUpdateRequest {
        if(name == null && description == null && capacity == null) throw new RequiredValueMissingException();

        if(name != null) if(name.isBlank()) throw new BlankValueNotAllowedException();
        if(description != null) if(description.isBlank()) throw new BlankValueNotAllowedException();
        if(capacity != null) if(capacity <= 0) throw new PositiveValueRequiredException();


    }
}
