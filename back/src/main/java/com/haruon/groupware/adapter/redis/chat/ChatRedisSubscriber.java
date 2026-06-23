package com.haruon.groupware.adapter.redis.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.websocket.dto.ChatServerMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class ChatRedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(
            Message message,
            byte[] pattern
    ) {
        try {
            String payload = new String(message.getBody(), StandardCharsets.UTF_8);

            ChatServerMessage event = objectMapper.readValue(
                    payload,
                    ChatServerMessage.class
            );

            messagingTemplate.convertAndSend(
                    "/topic/chat/rooms/" + event.roomId(),
                    event
            );
        } catch (Exception e) {
            throw new IllegalStateException("Redis 채팅 이벤트 처리 실패", e);
        }

    }
}
