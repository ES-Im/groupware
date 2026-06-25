package com.haruon.groupware.application.chat.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

public record MyChatRoomsResponse(
        Long chatRoomId,
        @Nullable String roomName,

        @Nullable String lastMessageContent,
        @Nullable LocalDateTime lastMessagedAt,
        @Nullable Long unreadMessageCount,

        Boolean isGroup,
        Boolean isPastRoom,
        Boolean isBookmarked,

        Long joinedMemberCount
) {
}
