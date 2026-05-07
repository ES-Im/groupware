package com.haruon.groupware.application.message.provided;

import java.time.LocalDateTime;

public interface SentMessageManagement {

    void moveToTrash(Long senderId, Long messageId, LocalDateTime movedAt);

    void restoreFromTrash(Long senderId, Long messageId);

    void deleteFromBox(Long senderId, Long messageId, LocalDateTime deletedAt);

}
