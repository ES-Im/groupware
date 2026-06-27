package com.haruon.groupware.application.chat.service.command;

import com.haruon.groupware.application.chat.event.ChatMessageCreatedEvent;
import com.haruon.groupware.application.chat.provided.forCommand.ChatSender;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.chat.ChatRoom;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.chat.service.support.ChatUtils.findChatRoom;
import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static com.haruon.groupware.domain.chat.ChatMessage.normalizeClientMessageId;

@Transactional
@Service
@RequiredArgsConstructor
public class ChatService implements ChatSender {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRepository chatRepository;
    private final EmpRepository empRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public ChatMessageResponse send(
            Long roomId,
            Long senderId,
            String clientMessageId,
            String message,
            LocalDateTime sendAt
    ) {
        ChatRoom chatRoom = findChatRoom(chatRoomRepository, roomId);
        Emp sender = findActiveEmpById(empRepository, senderId);
        String normalizedClientMessageId = normalizeClientMessageId(clientMessageId);

        ChatMessage existing = chatRepository
                .findByEmpIdAndClientMessageId(senderId, normalizedClientMessageId)
                .orElse(null);

        if (existing != null) { // front 재시도 검증
            validateSameRequest(existing, roomId, message);
            return ChatMessageResponse.from(existing);
        }

        ChatMessage msg = chatRoom.sendChat(
                sender,
                normalizedClientMessageId,
                message,
                sendAt
        );

        ChatMessage saved = chatRepository.save(msg);
        ChatMessageResponse response = ChatMessageResponse.from(saved);

        eventPublisher.publishEvent(
                new ChatMessageCreatedEvent(roomId, response)
        );

        return response;
    }

    private void validateSameRequest(
            ChatMessage existing,
            Long roomId,
            String message
    ) {
        if (!existing.getChatRoom().getId().equals(roomId)
                || !existing.getContent().equals(message)) {
            throw new IllegalArgumentException(
                    "clientMessageId가 다른 채팅 요청에 이미 사용됨"
            );
        }
    }

}
