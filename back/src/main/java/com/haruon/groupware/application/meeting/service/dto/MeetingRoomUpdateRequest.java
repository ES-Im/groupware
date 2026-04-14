package com.haruon.groupware.application.meeting.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static org.springframework.util.Assert.state;

@Builder
public record MeetingRoomUpdateRequest (
        Long roomId,
        Long adminId,

        @Nullable String name,
        @Nullable String description,
        @Nullable Integer capacity
) {
    public MeetingRoomUpdateRequest {
        boolean isEdited = name != null || description != null || capacity != null;

        state(isEdited, "변경내용이 없음");

        if(name != null) state(!name.isBlank(), "회의방 이름은 빈칸이 될 수 없음");
        if(description != null) state(!description.isBlank(), "회의 설명은 빈칸이 될 수 없음");
        if(capacity != null) state(capacity > 0, "수용인원은 1명 이상이어야 함");


    }
}
