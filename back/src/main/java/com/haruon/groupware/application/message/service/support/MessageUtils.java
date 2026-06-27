package com.haruon.groupware.application.message.service.support;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.domain.message.Message;

public class MessageUtils {

    public static Message findMessage(MessageRepository messageRepository, Long messageDraftId) {
        if(messageDraftId == null) throw new RequiredValueMissingException();

        return messageRepository.findById(messageDraftId).orElseThrow(MessageNotFoundException::new);
    }


}
