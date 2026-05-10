package com.haruon.groupware.application.meeting.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

@Builder
public record MeetingRoomCreateRequest(
        Long editorId,
        String name,
        String description,
        Integer capacity
) {
    public MeetingRoomCreateRequest {
        if(name == null || description == null || capacity == null || editorId == null) throw new RequiredValueMissingException();
        if(name.isBlank() || description.isBlank()) throw new BlankValueNotAllowedException();
        if(capacity <= 0) throw new PositiveValueRequiredException();
    }
}
