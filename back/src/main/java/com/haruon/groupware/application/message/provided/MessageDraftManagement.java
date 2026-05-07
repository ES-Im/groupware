package com.haruon.groupware.application.message.provided;

import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.dto.MessageFileRequest;
import com.haruon.groupware.application.message.service.dto.MessageUpdateRequest;

import java.time.LocalDateTime;
import java.util.Set;

public interface MessageDraftManagement {

    long saveDraft(Long senderId, MessageCreateRequest request);

    long sendMessage(Long senderId, MessageCreateRequest request);

    void sendDraft(Long senderId, Long messageDraftId, LocalDateTime sentAt);

    void deleteDraft(Long draftId, Long messageDraftId);

    void changeDraft(Long draftId, Long messageDraftId, MessageUpdateRequest request);

    void changeReceivers(Long draftId, Long messageDraftId, Set<Long> receiverIds);

    void addFile(Long senderId, Long messageDraftId, MessageFileRequest request);

    void removeFile(Long senderId, Long messageDraftId, Long fileId);
}
