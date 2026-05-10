package com.haruon.groupware.application.chat.service;

import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.exception.chat.ChatNotFoundException;
import com.haruon.groupware.application.exception.chat.ChatRoomNotFoundException;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.chat.ChatRoom;

public class ChatUtils {

    static ChatRoom findChatRoom(ChatRoomRepository chatRoomRepository, Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(ChatRoomNotFoundException::new);
    }

    static ChatMessage findChat(ChatRepository chatRepository, Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(ChatNotFoundException::new);
    }

}
