package com.haruon.groupware.application.meeting.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record MeetingRoomCreateRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank String description,
        @Positive Integer capacity
) {
    public MeetingRoomCreateRequest {
        if(name == null || description == null || capacity == null) throw new RequiredValueMissingException();
        if(name.isBlank() || description.isBlank()) throw new BlankValueNotAllowedException();
        if(capacity <= 0) throw new PositiveValueRequiredException();
    }
}
