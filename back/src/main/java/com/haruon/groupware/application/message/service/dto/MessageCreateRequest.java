package com.haruon.groupware.application.message.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record MessageCreateRequest(

        String title,

        String content,

        @Nullable Set<Long> receiverIds,

        @Nullable LocalDateTime sentAt

) {

    public MessageCreateRequest {
        if(title == null || content == null) throw new RequiredValueMissingException();

        if(title.isBlank() || content.isBlank()) throw new BlankValueNotAllowedException();

        if(sentAt != null && receiverIds == null) throw new RequiredValueMissingException();

    }

}
