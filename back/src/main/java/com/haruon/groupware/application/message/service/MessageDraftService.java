package com.haruon.groupware.application.message.service;

import com.haruon.groupware.application.message.provided.MessageDraftManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Transactional
@Service
@RequiredArgsConstructor
public class MessageDraftService implements MessageDraftManagement {

    private final MessageRepository messageRepository;

}
