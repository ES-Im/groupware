package com.haruon.groupware.application.chat.provided.forCommand;

import java.time.LocalDateTime;

public interface ChatRoomCleanup {

    void cleanupChatRooms(LocalDateTime currentTime);

}
