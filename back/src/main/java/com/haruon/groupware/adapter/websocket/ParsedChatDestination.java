package com.haruon.groupware.adapter.websocket;

public record ParsedChatDestination(
        DestinationType destinationType,
        long roomId
) {
    public enum DestinationType {
        SEND_MESSAGE,
        SUBSCRIBE_ROOM
    }
}
