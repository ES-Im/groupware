package com.haruon.groupware.application.message.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record MessageCreateRequest(

        String title,

        String content,

        @Nullable Set<Long> receiverIds,

        @Nullable LocalDateTime sentAt

) {

    public MessageCreateRequest {
        requireNonNull(title);
        requireNonNull(content);

        state(!title.isBlank(), "제목은 공백이 될 수 없음");
        state(!content.isBlank(), "내용은 공백이 될 수 없음");

        if(sentAt != null) requireNonNull(receiverIds);
    }

}
