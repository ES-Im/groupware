package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.haruon.groupware.domain.chat.ChatMessage.createMessage;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = "members")
public class ChatRoom extends AbstractEntity {

    private Boolean isGroup;

    private Emp emp;

    @Nullable private LocalDateTime lastMessageAt;

    @Nullable private LocalDateTime closedAt;

    private List<ChatMember> members = new ArrayList<>();


    public static ChatRoom createRoom(
            Emp roomOwner,
            List<Emp> members,
            LocalDateTime createAt
    ) {
        requireNonNull(roomOwner);
        requireNonNull(members);

        List<Emp> participants = new ArrayList<>(members);
        participants.add(roomOwner);

        state(participants.size() >= 2, "채팅 참가자는 최소 2명 이상 필요");

        ChatRoom room = new ChatRoom();

        room.emp = roomOwner;
        room.isGroup = participants.size() > 2;

        room.members = ChatMember.joinAtCreateRoom(room, participants, createAt);

        return room;
    }

    public void inviteMember(
            Emp inviter,
            Emp member,
            LocalDateTime invitedAt
    ) {
        requireNonNull(inviter);
        requireNonNull(member);
        requireNonNull(invitedAt);

        validateRoomOpen();
        getActiveMemberByEmp(inviter);

        state(!isParticipating(member), "이미 참여 중인 멤버");

        ChatMember leftMember = this.members.stream()
                .filter(m -> m.getEmp().equals(member))
                .filter(m -> !m.isParticipating())
                .findFirst()
                .orElse(null);

        if (leftMember != null) {
            leftMember.rejoin(invitedAt);
            updateGroupStatus();
            return;
        }

        this.members.add(ChatMember.joinAtInvite(this, member, invitedAt));
        updateGroupStatus();
    }

    public void updateDisplayNameByMember(Emp editor, String newName) {
        validateRoomOpen();
        ChatMember chatMember = getActiveMemberByEmp(editor);

        chatMember.updateRoomName(newName);
    }

    public void leaveRoomByMember(Emp editor, LocalDateTime leaveAt) {
        validateRoomOpen();
        ChatMember chatMember = getActiveMemberByEmp(editor);

        chatMember.leaveRoom(leaveAt);
        updateGroupStatus();

        boolean hasActiveMember = this.members.stream()
                .anyMatch(ChatMember::isParticipating);

        if (!hasActiveMember) {
            this.closedAt = leaveAt;
        }
    }

    public void markAsBookMarkedByMember(Emp editor) {
        validateRoomOpen();
        ChatMember chatMember = getActiveMemberByEmp(editor);

        chatMember.markBookMarked();
    }

    public void unmarkAsBookMarkedByMember(Emp editor) {
        validateRoomOpen();
        ChatMember chatMember = getActiveMemberByEmp(editor);

        chatMember.unmarkBookMarked();
    }

    public void changeLastReadMessageByMember(Emp editor, ChatMessage message) {
        validateRoomOpen();

        ChatMember chatMember = getActiveMemberByEmp(editor);

        chatMember.changeLastMessage(message);
    }

    public boolean isDeletable(LocalDateTime currentTime) {
        requireNonNull(currentTime);

        return this.closedAt != null
                && !currentTime.isBefore(this.closedAt.plusDays(30));
    }

    public boolean isParticipating(Emp emp) {
        requireNonNull(emp);

        return members.stream()
                .filter(member -> member.getEmp().equals(emp))
                .anyMatch(ChatMember::isParticipating);
    }

    public ChatMessage sendChat(
            Emp sender,
            String content,
            LocalDateTime sentAt
    ) {
        requireNonNull(sender);
        requireNonNull(content);
        requireNonNull(sentAt);

        validateRoomOpen();

        ChatMember member = getActiveMemberByEmp(sender);

        state(!sentAt.isBefore(member.getJoinedAt()),
                "참여시각 이전보다 채팅 생성 시각이 이를 수 없음");

        if (this.lastMessageAt != null) {
            state(sentAt.isAfter(this.lastMessageAt),
                    "채팅보낸 시각은 가장 최근의 채팅 생성 시각보다 이를 수 없음");
        }

        this.lastMessageAt = sentAt;

        return createMessage(this, sender, content, sentAt);
    }

    private void updateGroupStatus() {
        this.isGroup = this.members.stream()
                .filter(ChatMember::isParticipating)
                .count() > 2;
    }

    private ChatMember getActiveMemberByEmp(Emp editor) {
        requireNonNull(editor);

        return this.members.stream()
                .filter(member -> member.getEmp().equals(editor))
                .filter(ChatMember::isParticipating)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 참가자가 없음"));
    }

    private void validateRoomOpen() {
        state(this.closedAt == null, "종료된 채팅방");
    }

}
