package com.haruon.groupware.application.chat.provided;

import java.time.LocalDateTime;

public interface ChatSender {

    long send(Long roomId, Long senderId, String message, LocalDateTime sendAt);
}
