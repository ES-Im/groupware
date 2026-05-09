package com.haruon.groupware.application.chat.required;

import com.haruon.groupware.domain.chat.ChatRoom;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface ChatRoomRepository extends Repository<ChatRoom, Long> {
    ChatRoom save(ChatRoom room);

    Optional<ChatRoom> findById(Long roomId);

    void deleteAll();
}
