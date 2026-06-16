package com.haruon.groupware.application.franchise.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record EducationCreateRequest(

        @NotNull
        LocalDateTime educationDate,

        @NotBlank
        @Size(max = 50)
        String place,

        @NotBlank
        @Size(max = 50)
        String title,

        @NotBlank
        String content,

        @Positive
        Long capacity
) {

    public EducationCreateRequest {
        if(educationDate == null || place == null || title == null || content == null || capacity == null) throw new RequiredValueMissingException();

        if(place.isBlank() || title.isBlank() || content.isBlank()) throw new BlankValueNotAllowedException();

        if(capacity <= 0) throw new PositiveValueRequiredException();

    }
}
