package com.haruon.groupware.application.board.service;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record BoardUpdateRequest(

        @Nullable Long categoryId,

        @Nullable String title,

        @Nullable String content,

        LocalDateTime modifiedAt
) {

    public BoardUpdateRequest {
        requireNonNull(modifiedAt);

        state(categoryId != null || title != null || content != null, "수정할 내용이 없음");

        if(title != null) state(!title.isBlank(), "제목은 공백이 될 수 없음");
        if(content != null) state(!content.isBlank(), "내용은 공백이 될 수 없음");
    }
}
