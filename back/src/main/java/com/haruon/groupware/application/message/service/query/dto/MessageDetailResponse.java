package com.haruon.groupware.application.message.service.query.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record MessageDetailResponse(
        Long messageId,
        String title,
        String content,

        Long senderId,
        @Nullable String senderDeptName,
        String senderName,

        List<ReceiverInfo> receivers,

        @Nullable LocalDateTime sentAt,
        Boolean isSentByMe,
        Boolean isTrashedByMe,

        Integer fileCount
) {
    public MessageDetailResponse(
            MessageInfo messageInfo,
            List<ReceiverInfo> receiverInfo
    ) {
        this(
                messageInfo.messageId, messageInfo.title, messageInfo.content,

                messageInfo.senderId, messageInfo.senderDeptName, messageInfo.senderName,

                receiverInfo,

                messageInfo.sentAt, messageInfo.isSentByMe, messageInfo.isTrashedByMe,

                messageInfo.fileCount
        );
    }

    public record MessageInfo(
            Long messageId,
            String title,
            String content,

            Long senderId,
            @Nullable String senderDeptName,
            String senderName,

            @Nullable LocalDateTime sentAt,
            Boolean isTrashedByMe,
            Boolean isSentByMe,

            Integer fileCount
    ) {}

    public record ReceiverInfo(
            Long receiverId,
            @Nullable String receiverDeptName,
            String receiverName,
            Boolean isRead
    ) {
    }
}
