package com.haruon.groupware.application.chat.provided;

import java.time.LocalDateTime;

public interface ChatRoomCleanup {

    boolean deletableChatroomByBatch(Long roomId, LocalDateTime currentTime);

}
