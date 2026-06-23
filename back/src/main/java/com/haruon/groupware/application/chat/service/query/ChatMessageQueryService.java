package com.haruon.groupware.application.chat.service.query;

import com.haruon.groupware.application.chat.provided.forRetrieve.ChatMessageRetriever;
import com.haruon.groupware.application.chat.required.ChatMessageQueryRepository;
import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ChatMessageQueryService implements ChatMessageRetriever {

    private final ChatMessageQueryRepository chatMessageQueryRepository;

    @Override
    public ChatMessagesResponse retrieveChatMessages(
            Long empId,
            Long roomId,
            @Nullable Long cursor,
            Integer size
    ) {
        return chatMessageQueryRepository
                .findRecentMessagesByRoomIdAndEmpIdBeforeCursor(
                    empId, roomId, cursor, size
                );
    }
}
