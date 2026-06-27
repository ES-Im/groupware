package com.haruon.groupware.application.chat.provided.forRetriever;

import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import org.jspecify.annotations.Nullable;

import java.util.List;

public interface ChatRoomRetriever {
    List<MyChatRoomsResponse> retrieveChatRooms(Long empId, @Nullable String keyword, @Nullable Boolean isBookmark);

    ChatRoomDetailResponse retrieveChatRoomDetail(Long empId, Long roomId);
}
