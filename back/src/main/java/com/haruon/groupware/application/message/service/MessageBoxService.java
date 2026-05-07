package com.haruon.groupware.application.message.service;

import com.haruon.groupware.application.message.provided.ReceivedMessageManagement;
import com.haruon.groupware.application.message.provided.SentMessageManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Transactional
@Service
@RequiredArgsConstructor
public class MessageBoxService implements ReceivedMessageManagement, SentMessageManagement {

    private final MessageRepository messageRepository;
}
