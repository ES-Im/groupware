package com.haruon.groupware.adapter.websocket;

import com.haruon.groupware.adapter.websocket.exception.NotAllowedStompMessage;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.stomp.StompCommand;

import static com.haruon.groupware.adapter.websocket.ParsedChatDestination.DestinationType.SEND_MESSAGE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChatDestinationParserTest {

    private final ChatDestinationParser parser = new ChatDestinationParser();

    @Test
    void parsesSendDestination() {
        ParsedChatDestination parsed = parser.parse(
                StompCommand.SEND,
                "/app/chat/rooms/17/messages"
        );

        assertThat(parsed.destinationType()).isEqualTo(SEND_MESSAGE);
        assertThat(parsed.roomId()).isEqualTo(17L);
    }

    @Test
    void rejectsUnknownDestination() {
        assertThatThrownBy(() ->
                parser.parse(StompCommand.SUBSCRIBE, "/topic/chat/rooms/0")
        ).isInstanceOf(NotAllowedStompMessage.class);
    }
}
