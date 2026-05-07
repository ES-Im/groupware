package com.haruon.groupware.application.chat.required;

import com.haruon.groupware.domain.chat.ChatMessage;
import org.springframework.data.repository.Repository;

public interface ChatRepository extends Repository<ChatMessage, Long> {
}
