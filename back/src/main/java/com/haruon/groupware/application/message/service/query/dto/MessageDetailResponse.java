package com.haruon.groupware.application.message.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record MessageDetailResponse(
        Long messageId,

        Long senderId,
        @Nullable String senderDeptName,
        String senderName,

        String title,
        String content,

        @Nullable LocalDateTime sentAt,
        @Nullable LocalDateTime readAt,
        @Nullable LocalDateTime trashedAt,
        Boolean isSentByMe,

        Integer fileCount,

        List<ReceiverInfo> receivers
) {
    public MessageDetailResponse(
            MessageInfo messageInfo,
            List<ReceiverInfo> receiverInfo
    ) {
        this(
                messageInfo.messageId,
                messageInfo.senderId, messageInfo.senderDeptName, messageInfo.senderName,
                messageInfo.title, messageInfo.content,
                messageInfo.sentAt, messageInfo.readAt, messageInfo.trashedAt, messageInfo.isSentByMe,
                messageInfo.fileCount,
                receiverInfo
        );
    }

    public record MessageInfo(
            Long messageId,

            Long senderId,
            @Nullable String senderDeptName,
            String senderName,

            String title,
            String content,

            @Nullable LocalDateTime sentAt,
            @Nullable LocalDateTime readAt,
            @Nullable LocalDateTime trashedAt,
            Boolean isSentByMe,

            Integer fileCount
    ) {}

    public record ReceiverInfo(
            Long receiverId,
            @Nullable String receiverDeptName,
            String receiverName,
            @Nullable LocalDateTime readAt
    ) {
    }
}
