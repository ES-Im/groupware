package com.haruon.groupware.application.board.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record BoardCreateRequest(
        Long categoryId,

        String title,

        String content,

        @Nullable
        LocalDateTime publishedAt
) {

    public BoardCreateRequest {
        if(categoryId == null || title == null || content == null) throw new RequiredValueMissingException();

        if(content.isBlank() || title.isBlank()) throw new BlankValueNotAllowedException();
    }
}
