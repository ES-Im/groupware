package com.haruon.groupware.application.message.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

@Builder
public record MessageCreateRequest(

        @NotBlank
        @Size(max = 50)
        String title,

        @NotBlank
        String content,

        @Nullable Set<Long> receiverIds


) {

    public MessageCreateRequest {
        if(title == null || content == null) throw new RequiredValueMissingException();

        if(title.isBlank() || content.isBlank()) throw new BlankValueNotAllowedException();

    }

}
