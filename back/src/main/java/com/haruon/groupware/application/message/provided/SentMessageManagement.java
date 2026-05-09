package com.haruon.groupware.application.message.provided;

import java.time.LocalDateTime;

public interface SentMessageManagement {

    void moveToTrashBySender(Long senderId, Long messageId, LocalDateTime movedAt);

    void restoreFromTrashBySender(Long senderId, Long messageId);

    void deleteFromBoxBySender(Long senderId, Long messageId, LocalDateTime deletedAt);


}
