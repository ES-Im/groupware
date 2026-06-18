package com.haruon.groupware.application.message.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

public record MessagesResponse(
        Long messageId,
        String title,

        Long senderId,
        @Nullable String senderDeptName,
        String senderName,

        @Nullable Long representativeReceiverId,
        @Nullable String representativeReceiverDeptName,
        @Nullable String representativeReceiverName,
        Integer receiverCount,

        @Nullable LocalDateTime sentAt,
        @Nullable Boolean isRead,
        @Nullable LocalDateTime trashedAt,
        Boolean isSentByMe,
        Integer fileCount
) { }

