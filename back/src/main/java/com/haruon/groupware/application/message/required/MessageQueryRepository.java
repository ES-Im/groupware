package com.haruon.groupware.application.message.required;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface MessageQueryRepository {
    Page<MessagesResponse> findReceivedMessageByEmpId(
            Long receiverEmpId,
            @Nullable String keyword,
            @Nullable Boolean isRead,
            Pageable pageable
    );

    Page<MessagesResponse> findSentMessageByEmpId(
            Long senderEmpId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<MessagesResponse> findDraftMessageByEmpId(
            Long writerEmpId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<MessagesResponse> findMessageInTrashByEmpId(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Optional<MessageDetailResponse> findMessageById(Long empId, Long messageId);

    MessageCountResponse findMessageSummaryCountsByEmpId(Long empId);

    List<FileListInfo> findMessageFilesById(Long empId, Long messageId);
}
