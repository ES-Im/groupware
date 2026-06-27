package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ChatMessage extends AbstractEntity {

    private ChatRoom chatRoom;

    private Emp emp;

    private String clientMessageId;

    private String content;

    private LocalDateTime sentAt;

    static ChatMessage createMessage (
            ChatRoom chatRoom,
            Emp sender,
            String clientMessageId,
            String content,
            LocalDateTime sentAt
    ) {
        ChatMessage message = new ChatMessage();

        message.chatRoom = requireNonNull(chatRoom);
        message.emp = requireNonNull(sender);
        message.clientMessageId = normalizeClientMessageId(clientMessageId);
        message.content = requireNonNull(content);
        message.sentAt = requireNonNull(sentAt);

        return message;
    }

    public static String normalizeClientMessageId(String clientMessageId) {
        requireNonNull(clientMessageId);

        final String normalized;
        try {
            normalized = UUID.fromString(clientMessageId).toString();
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "올바르지 않은 clientMessageId UUID 형식",
                    exception
            );
        }

        if (!normalized.equalsIgnoreCase(clientMessageId)) {
            throw new IllegalArgumentException(
                    "올바르지 않은 clientMessageId UUID 형식"
            );
        }

        return normalized;
    }
}
