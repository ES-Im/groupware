package com.haruon.groupware.adapter.websocket.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * PUB를 위한 응답 JSON RESPONSE
 */
public record ChatServerMessage(
        UUID eventId, EventType eventType,
        Long roomId, Instant occurredAt,
        com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse data
) {
    public enum EventType {
        MESSAGE_CREATED
    }
}
