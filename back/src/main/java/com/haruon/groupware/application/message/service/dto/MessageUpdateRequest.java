package com.haruon.groupware.application.message.service.dto;

import org.jspecify.annotations.Nullable;

import static org.springframework.util.Assert.state;

public record MessageUpdateRequest(
        @Nullable
        String content,

        @Nullable
        String title
) {

    public MessageUpdateRequest {

        state(content != null || title != null, "수정할 내용이 없음");

        if(title != null) state(!title.isBlank(), "제목은 공백이 될 수 없음");
        if(content != null) state(!content.isBlank(), "내용은 공백이 될 수 없음");

    }
}
