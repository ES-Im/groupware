package com.haruon.groupware.application.board.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record BoardCreateRequest(
        @NotNull
        Long categoryId,

        @NotNull @Size(max = 50)
        String title,

        @NotNull @NotBlank
        String content,

        @Nullable
        LocalDateTime publishedAt
) {

    public BoardCreateRequest {
        if(categoryId == null || title == null || content == null) throw new RequiredValueMissingException();

        if(content.isBlank() || title.isBlank()) throw new BlankValueNotAllowedException();
    }
}
