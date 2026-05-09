package com.haruon.groupware.application.message.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.message.provided.ReceivedMessageManagement;
import com.haruon.groupware.application.message.provided.SentMessageManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.message.service.MessageUtils.findMessage;
import static com.haruon.groupware.application.utils.Utils.findEmpById;

@Transactional
@Service
@RequiredArgsConstructor
public class MessageBoxService implements ReceivedMessageManagement, SentMessageManagement {

    private final MessageRepository messageRepository;
    private final EmpRepository empRepository;

    @Override
    public void markAsRead(Long receiverId, Long messageId, LocalDateTime readAt) {
        Emp receiver = findEmpById(empRepository, receiverId);
        Message message = findMessage(messageRepository, messageId);

        message.markAsRead(receiver, readAt);
    }

    @Override
    public void moveToTrashByReceiver(Long receiverId, Long messageId, LocalDateTime movedAt) {
        Emp receiver = findEmpById(empRepository, receiverId);
        Message message = findMessage(messageRepository, messageId);

        message.moveToTrashByReceivers(receiver, movedAt);
    }

    @Override
    public void restoreFromTrashByReceiver(Long receiverId, Long messageId) {
        Emp receiver = findEmpById(empRepository, receiverId);
        Message message = findMessage(messageRepository, messageId);

        message.restoreFromTrashByReceivers(receiver);
    }

    @Override
    public void deleteFromBoxByReceiver(Long receiverId, Long messageId, LocalDateTime deletedAt) {
        Emp receiver = findEmpById(empRepository, receiverId);
        Message message = findMessage(messageRepository, messageId);

        message.deleteFromBoxByReceivers(receiver, deletedAt);
    }



    @Override
    public void moveToTrashBySender(Long senderId, Long messageId, LocalDateTime movedAt) {
        Emp receiver = findEmpById(empRepository, senderId);
        Message message = findMessage(messageRepository, messageId);

        message.moveToTrashBySender(receiver, movedAt);
    }

    @Override
    public void restoreFromTrashBySender(Long senderId, Long messageId) {
        Emp receiver = findEmpById(empRepository, senderId);
        Message message = findMessage(messageRepository, messageId);

        message.restoreFromTrashBySender(receiver);
    }

    @Override
    public void deleteFromBoxBySender(Long senderId, Long messageId, LocalDateTime deletedAt) {
        Emp sender = findEmpById(empRepository, senderId);
        Message message = findMessage(messageRepository, messageId);

        message.deleteFromBoxBySender(sender, deletedAt);
    }


}
