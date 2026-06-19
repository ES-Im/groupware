package com.haruon.groupware.application.message.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;


public record MessageUpdateRequest(
        @Nullable
        String content,

        @Nullable
        @Size(max = 50)
        String title
) {

    public MessageUpdateRequest {
        if(content == null && title == null) throw new RequiredValueMissingException();
        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null) if(content.isBlank()) throw new BlankValueNotAllowedException();
    }
}
