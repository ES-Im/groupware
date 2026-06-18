package com.haruon.groupware.application.meeting.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;


@Builder
public record MeetingRoomUpdateRequest (
        @Nullable @Size(max = 50) String name,
        @Nullable String description,
        @Nullable @Positive Integer capacity
) {
    public MeetingRoomUpdateRequest {
        if(name == null && description == null && capacity == null) throw new RequiredValueMissingException();

        if(name != null) if(name.isBlank()) throw new BlankValueNotAllowedException();
        if(description != null) if(description.isBlank()) throw new BlankValueNotAllowedException();
        if(capacity != null) if(capacity <= 0) throw new PositiveValueRequiredException();


    }
}
