package com.haruon.groupware.application.message.provided;

import java.time.LocalDateTime;

public interface ReceivedMessageManagement {

    void markAsRead(Long receiverId, Long messageId, LocalDateTime readAt);

    void moveToTrash(Long receiverId, Long messageId, LocalDateTime movedAt);

    void restoreFromTrash(Long receiverId, Long messageId);

    void deleteFromBox(Long receiverId, Long messageId, LocalDateTime deletedAt);

}
