package com.haruon.groupware.application.message.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import org.jspecify.annotations.Nullable;


public record MessageUpdateRequest(
        @Nullable
        String content,

        @Nullable
        String title
) {

    public MessageUpdateRequest {
        if(content == null && title == null) throw new RequiredValueMissingException();
        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null) if(content.isBlank()) throw new BlankValueNotAllowedException();
    }
}
