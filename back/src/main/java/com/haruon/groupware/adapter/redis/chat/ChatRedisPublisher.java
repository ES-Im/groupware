package com.haruon.groupware.adapter.redis.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.websocket.dto.ChatServerMessage;
import com.haruon.groupware.application.chat.event.ChatMessageCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.UUID;

import static com.haruon.groupware.adapter.redis.chat.ChatRedisChannelConfig.MESSAGE_CREATED_CHANNEL;
import static com.haruon.groupware.adapter.websocket.dto.ChatServerMessage.EventType.MESSAGE_CREATED;

@Component
@RequiredArgsConstructor
public class ChatRedisPublisher {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Retryable(
            retryFor = RuntimeException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void publish(ChatMessageCreatedEvent event) {
        ChatServerMessage message = new ChatServerMessage(
                UUID.randomUUID(),
                MESSAGE_CREATED,
                event.roomId(),
                Instant.now(),
                event.message()
        );

        try {
            String payload = objectMapper.writeValueAsString(message);

            redisTemplate.convertAndSend(
                    MESSAGE_CREATED_CHANNEL,
                    payload
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Redis chat message object 직렬화 실패", e);
        }
    }
}
