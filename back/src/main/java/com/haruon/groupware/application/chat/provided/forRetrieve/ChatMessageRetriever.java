package com.haruon.groupware.application.chat.provided.forRetrieve;

import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import org.jspecify.annotations.Nullable;

public interface ChatMessageRetriever {

    ChatMessagesResponse retrieveChatMessages(Long empId, Long roomId, @Nullable Long cursor, Integer size);

}
