package com.haruon.groupware.application.chat.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMessagesResponse(
        List<ChatMessageResponse> messages,
        @Nullable Long nextCursor,
        boolean hasNext
) {

    public record ChatMessageResponse(
            Long id,
            Long senderId,
            String clientMessageId,
            String senderName,
            String content,
            LocalDateTime sentAt,
            @Nullable String profileImageUrl
    ) {

        public ChatMessageResponse(
                Long id,
                Long senderId,
                String clientMessageId,
                String senderName,
                String content,
                LocalDateTime sentAt,
                @Nullable Long profileFileId) {

            this(
                id, senderId, clientMessageId, senderName, content, sentAt,
                    getProfileFileQueryApi(senderId, profileFileId)
            );

        }

        private static @Nullable String getProfileFileQueryApi(Long memberId, @Nullable Long profileFileId) {
            return profileFileId != null
                    ? "/api/employees/" + memberId + "/files/" + profileFileId + "/preview"
                    : null;
        }
    }

}
