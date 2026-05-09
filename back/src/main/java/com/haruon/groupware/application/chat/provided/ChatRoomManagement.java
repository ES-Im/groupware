package com.haruon.groupware.application.chat.provided;

import java.time.LocalDateTime;
import java.util.Set;

public interface ChatRoomManagement {

    long makeRoom(Long ownerId, Set<Long> memberIds, LocalDateTime createAt);

    void inviteRoomByMember(Long inviterId, Long roomId, Set<Long> receiverId, LocalDateTime invitedAt);

    void updateDisplayNameByMember(Long roomId, Long editorId, String name);

    void leaveRoomByMember(Long roomId, Long editorId, LocalDateTime leftAt);

    void markAsBookMarkedByMember(Long roomId, Long markerId);

    void unmarkAsBookMarkedByMember(Long roomId, Long unmarkerId);

    void renewLatestReadChatByMember(Long readerId, Long roomId, Long messageId);
}
