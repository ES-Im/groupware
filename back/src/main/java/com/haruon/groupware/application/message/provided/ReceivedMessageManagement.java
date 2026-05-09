package com.haruon.groupware.application.message.provided;

import java.time.LocalDateTime;

public interface ReceivedMessageManagement {

    void markAsRead(Long receiverId, Long messageId, LocalDateTime readAt);

    void moveToTrashByReceiver(Long receiverId, Long messageId, LocalDateTime movedAt);

    void restoreFromTrashByReceiver(Long receiverId, Long messageId);

    void deleteFromBoxByReceiver(Long receiverId, Long messageId, LocalDateTime deletedAt);

}
