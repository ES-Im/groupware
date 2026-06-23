package com.haruon.groupware.application.chat.service.query.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMessagesResponse(
        List<ChatMessageResponse> messages,
        Long nextCursor,    // 응답에 포함된 가장 오래된 메시지의 chatId
        boolean hasNext
) {

    public record ChatMessageResponse(
            Long id,
            Long senderId,
            String clientMessageId,
            String senderName,
            String content,
            LocalDateTime sentAt
    ) {}

}