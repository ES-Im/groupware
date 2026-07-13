package com.haruon.groupware.application.chat.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record MyChatRoomsResponse(
        Long chatRoomId,
        @Nullable String roomName,

        @Nullable String lastMessageContent,
        @Nullable LocalDateTime lastMessagedAt,
        @Nullable Long unreadMessageCount,

        Boolean isGroup,
        Boolean isPastRoom,
        Boolean isBookmarked,

        Long joinedMemberCount,

        // 채팅방 표시명(roomName)이 없을 때 화면에서 참여자 이름으로 폴백 표시하기 위한 목록이다.
        // 도메인 규칙(채팅방 이름 기본값은 null이며 view에서는 참여자 소속·이름이 보여진다)을
        // 목록 화면에서도 만족시키기 위해 목록 응답에 참여자 이름을 담는다. 본인은 제외한 다른
        // 참여자 이름이며 참여 순으로 담긴다.
        List<String> participantNames
) {

    // QueryDSL 1차 조회용 보조 생성자: participantNames는 어댑터에서 roomId 배치 조회 후
    // withParticipantNames로 주입하므로, 조회 시점엔 빈 리스트로 시작한다.
    public MyChatRoomsResponse(
            Long chatRoomId, @Nullable String roomName,
            @Nullable String lastMessageContent, @Nullable LocalDateTime lastMessagedAt,
            @Nullable Long unreadMessageCount,
            Boolean isGroup, Boolean isPastRoom, Boolean isBookmarked,
            Long joinedMemberCount
    ) {
        this(chatRoomId, roomName, lastMessageContent, lastMessagedAt, unreadMessageCount,
                isGroup, isPastRoom, isBookmarked, joinedMemberCount, List.of());
    }

    public MyChatRoomsResponse withParticipantNames(List<String> participantNames) {
        return new MyChatRoomsResponse(
                chatRoomId, roomName, lastMessageContent, lastMessagedAt, unreadMessageCount,
                isGroup, isPastRoom, isBookmarked, joinedMemberCount, participantNames
        );
    }
}
