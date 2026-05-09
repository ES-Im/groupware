package com.haruon.groupware.application.chat.required;

import com.haruon.groupware.domain.chat.ChatMessage;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface ChatRepository extends Repository<ChatMessage, Long> {

    ChatMessage save(ChatMessage message);

    Optional<ChatMessage> findById(Long id);

    void deleteAll();
}
