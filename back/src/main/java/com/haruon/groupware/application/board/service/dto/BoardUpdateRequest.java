package com.haruon.groupware.application.board.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record BoardUpdateRequest(

        @Nullable Long categoryId,

        @Nullable String title,

        @Nullable String content,

        LocalDateTime modifiedAt
) {

    public BoardUpdateRequest {
        if(modifiedAt == null) throw new RequiredValueMissingException();

        if(categoryId == null && title == null && content == null) throw new RequiredValueMissingException();


        if(title != null && title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null && content.isBlank()) throw new BlankValueNotAllowedException();
    }
}
