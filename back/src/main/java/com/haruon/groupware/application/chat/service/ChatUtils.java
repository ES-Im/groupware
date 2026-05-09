package com.haruon.groupware.application.chat.service;

import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.chat.ChatRoom;

public class ChatUtils {

    static ChatRoom findChatRoom(ChatRoomRepository chatRoomRepository, Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("조회된 채팅방이 없음"));
    }

    static ChatMessage findChat(ChatRepository chatRepository, Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("조회된 채팅내역이 없음"));
    }

}
