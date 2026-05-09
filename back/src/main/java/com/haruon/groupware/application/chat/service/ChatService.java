package com.haruon.groupware.application.chat.service;

import com.haruon.groupware.application.chat.provided.ChatSender;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.chat.ChatRoom;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.chat.service.ChatUtils.findChatRoom;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;

@Transactional
@Service
@RequiredArgsConstructor
public class ChatService implements ChatSender {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRepository chatRepository;
    private final EmpRepository empRepository;

    @Override
    public long send(Long roomId, Long senderId, String message, LocalDateTime sendAt) {
        ChatRoom chatRoom = findChatRoom(chatRoomRepository, roomId);
        Emp sender = findActiveEmpById(empRepository, senderId);

        ChatMessage msg = chatRoom.sendChat(
                sender, message, sendAt
        );

        return chatRepository.save(msg).getId();
    }

}
