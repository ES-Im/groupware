package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ChatMessage extends AbstractEntity {

    private ChatRoom chatRoom;

    private Emp emp;

    private String content;

    private LocalDateTime sentAt;

    static ChatMessage createMessage (
            ChatRoom chatRoom,
            Emp sender,
            String content,
            LocalDateTime sentAt
    ) {
        ChatMessage message = new ChatMessage();

        message.chatRoom = requireNonNull(chatRoom);
        message.emp = requireNonNull(sender);
        message.content = requireNonNull(content);
        message.sentAt = requireNonNull(sentAt);

        return message;
    }
}
