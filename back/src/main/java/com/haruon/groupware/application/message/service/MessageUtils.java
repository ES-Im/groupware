package com.haruon.groupware.application.message.service;

import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.domain.message.Message;

import static java.util.Objects.requireNonNull;

public class MessageUtils {

    static Message findMessage(MessageRepository messageRepository, Long messageDraftId) {
        requireNonNull(messageDraftId);

        return messageRepository.findById(messageDraftId).orElseThrow(MessageNotFoundException::new);
    }
}
