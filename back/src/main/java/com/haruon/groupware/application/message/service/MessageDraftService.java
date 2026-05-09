package com.haruon.groupware.application.message.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.message.provided.MessageDraftManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.dto.MessageFileRequest;
import com.haruon.groupware.application.message.service.dto.MessageUpdateRequest;
import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.message.service.MessageUtils.findMessage;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;
import static com.haruon.groupware.domain.message.Message.createDraft;
import static com.haruon.groupware.domain.message.Message.createSent;

@Transactional
@Service
@RequiredArgsConstructor
public class MessageDraftService implements MessageDraftManagement {

    private final MessageRepository messageRepository;
    private final EmpRepository empRepository;

    @Override
    public long saveMessageBeforeSend(Long senderId, MessageCreateRequest request) {
        Emp writer = findActiveEmpById(empRepository, senderId);

        Message draft = createDraft(
                request.title(), request.content(), writer
        );

        if(request.receiverIds() != null) {
            List<Emp> receivers = findEmpListById(empRepository, request.receiverIds());
            draft.replaceReceivers(writer, receivers);
        }

        return messageRepository.save(draft).getId();
    }

    @Override
    public long sendMessage(Long senderId, MessageCreateRequest request) {
        if(request.sentAt() == null) throw new IllegalArgumentException("발송시각이 없음");
        if(request.receiverIds() == null || request.receiverIds().isEmpty()) throw new IllegalArgumentException("수신자가 없음");

        Emp writer = findActiveEmpById(empRepository, senderId);
        List<Emp> recipientList = findEmpListById(empRepository, request.receiverIds());

        Message sentMsg = createSent(
                writer, request.title(), request.content(), recipientList, request.sentAt()
        );

        return messageRepository.save(sentMsg).getId();
    }

    @Override
    public void sendDraft(Long senderId, Long messageDraftId, LocalDateTime sentAt) {
        Emp sender = findActiveEmpById(empRepository, senderId);
        Message found = findMessage(messageRepository, messageDraftId);

        found.sendMessage(sender, sentAt);
    }



    @Override
    public void deleteDraft(Long writerId, Long messageDraftId) {
        Emp writer = findActiveEmpById(empRepository, writerId);
        Message found = findMessage(messageRepository, messageDraftId);

        found.validateForDeleteDraft(writer);

        messageRepository.delete(found);
    }

    @Override
    public void changeDraft(Long writerId, Long messageDraftId, MessageUpdateRequest request) {
        Message found = findMessage(messageRepository, messageDraftId);
        Emp writer = findActiveEmpById(empRepository, writerId);

        found.changeMessage(
                writer, request.title(), request.content()
        );
    }

    @Override
    public void changeReceivers(Long writerId, Long messageDraftId, Set<Long> receiverIds) {
        Message found = findMessage(messageRepository, messageDraftId);
        Emp writer = findActiveEmpById(empRepository, writerId);

        List<Emp> receivers = findEmpListById(empRepository, receiverIds);
        found.replaceReceivers(writer, receivers);
    }

    @Override
    public void addFile(Long writerId, Long messageDraftId, MessageFileRequest request) {
        Message found = findMessage(messageRepository, messageDraftId);
        Emp writer = findActiveEmpById(empRepository, writerId);
        FileDto file = request.file();

        found.addFile(
                writer,
                file.mimeType(),
                file.originalFileName(),
                file.extension(),
                file.fileSize()
        );
    }

    @Override
    public void removeFile(Long writerId, Long messageDraftId, Long fileId) {
        Message found = findMessage(messageRepository, messageDraftId);
        Emp writer = findActiveEmpById(empRepository, writerId);

        found.removeFile(writer, fileId);
    }

}
