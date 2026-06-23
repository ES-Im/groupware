package com.haruon.groupware.adapter.websocket;

import com.haruon.groupware.adapter.websocket.exception.NotAllowedStompMessage;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.haruon.groupware.adapter.websocket.ParsedChatDestination.DestinationType;

/**
 * [SEND와 SUBSCRIBE destination 제한]
 * 클라이언트에서 들어온 STOMP Message 중 'SEND와 SUBSCRIBE' 프레임이 들어올 경우
 * Message객체에 있는 command와 destination가 적절한지 정규식으로 검증하고,
 * destination에서 roomId를 추출해 ParsedChatDestination DTO로 변환
 */
@Component
public class ChatDestinationParser {

    private static final Pattern ALLOWED_SEND_MESSAGE_PATTERN = Pattern.compile(
            "^/app/chat/rooms/([1-9]\\d*)/messages$"
    );

    private static final Pattern ALLOWED_SUBSCRIBE_ROOM_PATTERN = Pattern.compile(
            "^/topic/chat/rooms/([1-9]\\d*)$"
    );

    public ParsedChatDestination parse(
            StompCommand command,
            String destination
    ) {
        if(destination == null || destination.isBlank()) throw new NotAllowedStompMessage("STOMP destination가 비어있습니다.");

        return switch (command) {
            case StompCommand.SEND ->
                parse(
                        destination,
                        ALLOWED_SEND_MESSAGE_PATTERN,
                        DestinationType.SEND_MESSAGE
                );

            case StompCommand.SUBSCRIBE ->
                parse(
                        destination,
                        ALLOWED_SUBSCRIBE_ROOM_PATTERN,
                        DestinationType.SUBSCRIBE_ROOM
                );

            default ->
                throw new NotAllowedStompMessage(
                        "not supported STOMP command: " + command
                );

        };

    }

    private ParsedChatDestination parse(
            String destination,
            Pattern pattern,
            DestinationType destinationType
    ) {
        Matcher matcher = pattern.matcher(destination);

        if (!matcher.matches()) {
            throw new NotAllowedStompMessage(
                    "허용되지 않은 STOMP destination: " + destination
            );
        }

        try {
            return new ParsedChatDestination(
                    destinationType,
                    Long.parseLong(matcher.group(1))
            );
        } catch (NumberFormatException exception) {
            throw new NotAllowedStompMessage(
                    "올바르지 않은 roomId: " + destination,
                    exception
            );
        }
    }

}
