package com.haruon.groupware.application.chat.required;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatRoomCleanupRepository {

    List<Long> findDeletableChatRoomId(LocalDateTime checkDate);

    void deleteAllByRoomIds(List<Long> roomIds);
}
