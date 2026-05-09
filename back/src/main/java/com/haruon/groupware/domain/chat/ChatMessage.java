package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ChatMessage extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="room_id", nullable = false, updatable=false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="sender_id", nullable = false, updatable=false)
    private Emp emp;

    @Column(nullable = false, updatable = false)
    private String content;

    @Column(nullable = false, updatable = false)
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
