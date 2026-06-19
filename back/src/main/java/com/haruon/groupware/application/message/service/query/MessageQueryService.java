package com.haruon.groupware.application.message.service.query;

import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.message.provided.forRetrieve.MessageRetriever;
import com.haruon.groupware.application.message.required.MessageQueryRepository;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageQueryService implements MessageRetriever {

    private final MessageQueryRepository messageQueryRepository;

    @Override
    public Page<MessagesResponse> retrieveReceivedMessages(
            Long receiverEmpId,
            @Nullable String keyword,
            @Nullable Boolean isRead,
            Pageable pageable
    ) {
        return messageQueryRepository
                .findReceivedMessageByEmpId(receiverEmpId, keyword, isRead, pageable);
    }

    @Override
    public Page<MessagesResponse> retrieveSentMessages(
            Long senderEmpId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return messageQueryRepository
                .findSentMessageByEmpId(senderEmpId, keyword, pageable);
    }

    @Override
    public Page<MessagesResponse> retrieveDraftMessages(
            Long writerEmpId, @Nullable String keyword, Pageable pageable
    ) {
        return messageQueryRepository
                .findDraftMessageByEmpId(writerEmpId, keyword, pageable);
    }

    @Override
    public Page<MessagesResponse> retrieveMessagesInTrash(
            Long empId, @Nullable String keyword, Pageable pageable
    ) {
        return messageQueryRepository
                .findMessageInTrashByEmpId(empId, keyword, pageable);
    }

    @Override
    public MessageDetailResponse retrieveMessage(Long empId, Long messageId) {
        return messageQueryRepository
                .findMessageById(empId, messageId)
                .orElseThrow(MessageNotFoundException::new);
    }

    @Override
    public MessageCountResponse retrieveMessageCount(Long empId) {
        return messageQueryRepository
                .findMessageSummaryCountsByEmpId(empId);
    }

    @Override
    public List<FileListInfo> retrieveMessageFiles(Long empId, Long messageId) {
        return messageQueryRepository
                .findMessageFilesById(empId, messageId);
    }
}
