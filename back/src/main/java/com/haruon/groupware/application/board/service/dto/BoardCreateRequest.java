package com.haruon.groupware.application.board.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record BoardCreateRequest(
        Long categoryId,

        String title,

        String content,

        @Nullable
        LocalDateTime publishedAt
) {

    public BoardCreateRequest {
        requireNonNull(categoryId);
        requireNonNull(title);
        requireNonNull(content);

        state(!title.isBlank(), "제목은 공백이 될 수 없음");
        state(!content.isBlank(), "내용은 공백이 될 수 없음");
    }
}
