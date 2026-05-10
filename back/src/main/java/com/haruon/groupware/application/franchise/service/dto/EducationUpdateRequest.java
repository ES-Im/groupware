package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record EducationUpdateRequest(

        @Nullable
        LocalDateTime educationDate,

        @Nullable
        String place,

        @Nullable
        String title,

        @Nullable
        String content,

        @Nullable
        Long capacity
) {

    public EducationUpdateRequest {
        if(educationDate == null && place == null && title == null && content == null && capacity == null) throw new RequiredValueMissingException();

        if(place != null) if(place.isBlank()) throw new BlankValueNotAllowedException();
        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null) if(content.isBlank()) throw new BlankValueNotAllowedException();

        if(capacity != null) if(capacity <= 0) throw new PositiveValueRequiredException();
    }
}
