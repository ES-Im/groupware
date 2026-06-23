package com.haruon.groupware.application.chat.required;

import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import org.jspecify.annotations.Nullable;

import java.util.List;

public interface ChatRoomQueryRepository {
    List<MyChatRoomsResponse> findJoinedChatRoomsByEmpId(
            Long empId,
            @Nullable String keyword,
            @Nullable Boolean isBookmark
    );

    ChatRoomDetailResponse findChatRoomByRoomId(Long roomId);

    boolean existRoomByIdAndEmpId(Long empId, Long roomId);

}
