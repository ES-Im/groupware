package com.haruon.groupware.application.message.provided.forCommand;

import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.command.dto.MessageUpdateRequest;

import java.time.LocalDateTime;
import java.util.Set;

public interface MessageDraftManagement {

    long saveMessageBeforeSend(Long senderId, MessageCreateRequest request);

    long sendMessage(Long senderId, MessageCreateRequest request, LocalDateTime sentAt);

    void sendDraft(Long senderId, Long messageDraftId, LocalDateTime sentAt);

    void deleteDraft(Long writerId, Long messageDraftId);

    void changeDraft(Long writerId, Long messageDraftId, MessageUpdateRequest request);

    void changeReceivers(Long writerId, Long messageDraftId, Set<Long> receiverIds);


}
