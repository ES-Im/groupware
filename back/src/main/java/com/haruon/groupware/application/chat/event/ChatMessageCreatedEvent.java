package com.haruon.groupware.application.chat.event;

import com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse;

public record ChatMessageCreatedEvent(
        Long roomId,
        ChatMessageResponse message
) {
}
