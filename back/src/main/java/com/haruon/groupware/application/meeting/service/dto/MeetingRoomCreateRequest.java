package com.haruon.groupware.application.meeting.service.dto;

import lombok.Builder;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record MeetingRoomCreateRequest(
        Long editor,
        String name,
        String description,
        Integer capacity
) {
    public MeetingRoomCreateRequest {
        requireNonNull(name);
        requireNonNull(description);
        requireNonNull(capacity);
        requireNonNull(editor);

        state(!name.isBlank(), "회의방 이름은 빈칸이 될 수 없음");
        state(!description.isBlank(), "회의 설명은 빈칸이 될 수 없음");
        state(capacity > 0, "수용인원은 양수여야함");

    }
}
