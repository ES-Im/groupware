package com.haruon.groupware.application.chat.service.query;

import com.haruon.groupware.application.chat.provided.forRetrieve.ChatRoomRetriever;
import com.haruon.groupware.application.chat.required.ChatRoomQueryRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import com.haruon.groupware.application.exception.chat.NotAllowedChatMemberException;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ChatRoomQueryService implements ChatRoomRetriever {

    private final ChatRoomQueryRepository chatRoomQueryRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Override
    public List<MyChatRoomsResponse> retrieveChatRooms(
            Long empId, @Nullable String keyword, @Nullable Boolean isBookmark
    ) {
        return chatRoomQueryRepository
                .findJoinedChatRoomsByEmpId(empId, keyword, isBookmark);
    }

    @Override
    public ChatRoomDetailResponse retrieveChatRoomDetail(Long empId, Long roomId) {
        if(!isEmpJoinedChatRoom(empId, roomId)) throw new NotAllowedChatMemberException();

        return chatRoomQueryRepository
                .findChatRoomByRoomId(roomId);
    }

    private boolean isEmpJoinedChatRoom(Long empId, Long roomId) {
        return chatRoomQueryRepository.existRoomByIdAndEmpId(empId, roomId);
    }
}
