package com.haruon.groupware.application.chat.service.command.dto;


import com.haruon.groupware.domain.chat.ChatMessage;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long chatId,
        Long roomId,
        Long senderId,
        String clientMessageId,
        String senderName,
        String content,
        LocalDateTime sentAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getChatRoom().getId(),
                message.getEmp().getId(),
                message.getClientMessageId(),
                message.getEmp().getEmpName(),
                message.getContent(),
                message.getSentAt()
        );
    }
}
