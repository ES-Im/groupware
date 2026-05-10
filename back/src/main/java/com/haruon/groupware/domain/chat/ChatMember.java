package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ChatMember extends AbstractEntity {

    private ChatRoom room;

    @Nullable private String roomName;

    private Emp emp;

    @Nullable private ChatMessage lastReadMessage;

    private boolean isBookMarked;

    private LocalDateTime joinedAt;

    @Nullable private LocalDateTime leftAt;

    static List<ChatMember> joinAtCreateRoom(
            ChatRoom room,
            List<Emp> members,
            LocalDateTime joinedAt
    ) {
        List<ChatMember> chatMembers = new ArrayList<>();

        requireNonNull(room);
        requireNonNull(members);
        requireNonNull(joinedAt);

        for (Emp emp : members) {
            ChatMember chatMember = new ChatMember();
            chatMember.emp = requireNonNull(emp);
            chatMember.room = room;
            chatMember.joinedAt = joinedAt;
            chatMember.isBookMarked = false;

            chatMembers.add(chatMember);
        }

        return chatMembers;
    }

    void rejoin(
            LocalDateTime joinedAt
    ) {
        requireNonNull(joinedAt);
        state(this.leftAt != null, "퇴장한 멤버만 재참여 가능");
        state(!joinedAt.isBefore(this.leftAt), "재참여일시는 퇴장일시보다 빠를 수 없음");

        this.joinedAt = joinedAt;
        this.leftAt = null;
        this.lastReadMessage = null;
    }

    static ChatMember joinAtInvite(
            ChatRoom room,
            Emp member,
            LocalDateTime joinedAt
    ) {
        ChatMember chatMember = new ChatMember();

        chatMember.room = requireNonNull(room);
        chatMember.emp = requireNonNull(member);
        chatMember.joinedAt = requireNonNull(joinedAt);
        chatMember.isBookMarked = false;

        return chatMember;
    }

    void updateRoomName(String newName) {
        this.roomName = requireNonNull(newName);
    }


    void leaveRoom(LocalDateTime leftAt) {
        requireNonNull(leftAt);
        state(this.leftAt == null, "이미 퇴장한 참여자");
        state(!leftAt.isBefore(this.joinedAt), "퇴장일시는 참여일시보다 빠를 수 없음");

        this.leftAt = requireNonNull(leftAt);
    }

    void markBookMarked() {
        this.isBookMarked = true;
    }

    void unmarkBookMarked() {
        this.isBookMarked = false;
    }

    void changeLastMessage(ChatMessage message) {
        requireNonNull(message);
        state(message.getChatRoom().equals(this.room), "같은 채팅방의 메시지만 읽음 처리 가능");
        state(!message.getSentAt().isBefore(this.joinedAt), "참여 이전 메시지는 읽음 처리할 수 없음");

        this.lastReadMessage = message;
    }

    public boolean isParticipating() {
        return this.leftAt == null;
    }

    public ChatMessage getLatestReadChats() {
        return this.lastReadMessage;
    }
}
