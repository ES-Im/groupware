package com.haruon.groupware.application.message.service.query.dto;

public record MessageCountResponse(
        Long receivedCount,
        Long unreadReceivedCount,
        Long sentCount,
        Long draftCount,
        Long trashCount
) {
}
