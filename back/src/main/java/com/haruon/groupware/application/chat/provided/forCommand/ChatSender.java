package com.haruon.groupware.application.chat.provided.forCommand;

import com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse;

import java.time.LocalDateTime;

public interface ChatSender {

    ChatMessageResponse send(
            Long roomId,
            Long senderId,
            String clientMessageId,
            String message,
            LocalDateTime sendAt
    );
}
