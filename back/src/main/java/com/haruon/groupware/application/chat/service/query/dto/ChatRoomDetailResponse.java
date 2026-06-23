package com.haruon.groupware.application.chat.service.query.dto;

import org.jspecify.annotations.Nullable;
import java.util.List;

public record ChatRoomDetailResponse(
        Long roomId,
        String roomName,
        Boolean isGroup,
        @Nullable Long lastReadMessageId,

        List<ChatRoomMember> members
) {

    public ChatRoomDetailResponse(
            ChatRoomInfo info,
            List<ChatRoomMember> members
    ) {
        this(
                info.roomId, info.roomName, info.isGroup, info.lastReadMessageId,
                members
        );
    }

    public record ChatRoomInfo(
        Long roomId,
        String roomName,
        Boolean isGroup,
        @Nullable Long lastReadMessageId
    ) {}

    public record ChatRoomMember(
        Long memberId,
        String deptName,
        String memberName,
        @Nullable Long profileFileId,
        @Nullable String profileImageUrl
    ) {}
}
