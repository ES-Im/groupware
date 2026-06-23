package com.haruon.groupware.application.chat.required;


import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import org.jspecify.annotations.Nullable;

public interface ChatMessageQueryRepository {
    ChatMessagesResponse findRecentMessagesByRoomIdAndEmpIdBeforeCursor(
            Long empId,
            Long roomId,
            @Nullable Long cursor,
            Integer size
    );
}
