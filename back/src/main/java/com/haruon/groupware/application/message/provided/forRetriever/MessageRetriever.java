package com.haruon.groupware.application.message.provided.forRetriever;

import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageRetriever {
    Page<MessagesResponse> retrieveReceivedMessages(
            Long receiverEmpId,
            @Nullable String keyword,
            @Nullable Boolean isRead,
            Pageable pageable
    );

    Page<MessagesResponse> retrieveSentMessages(
            Long senderEmpId, @Nullable String keyword, Pageable pageable
    );

    Page<MessagesResponse> retrieveDraftMessages(
            Long writerEmpId, @Nullable String keyword, Pageable pageable
    );

    Page<MessagesResponse> retrieveMessagesInTrash(
            Long empId, @Nullable String keyword, Pageable pageable
    );

    MessageDetailResponse retrieveMessage(
            Long empId, Long messageId
    );

    MessageCountResponse retrieveMessageCount(Long empId);

    List<FileListInfo> retrieveMessageFiles(Long empId, Long messageId);
}
