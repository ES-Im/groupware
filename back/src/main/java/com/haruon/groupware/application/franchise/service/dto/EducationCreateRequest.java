package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record EducationCreateRequest(

        LocalDateTime educationDate,

        String place,

        String title,

        String content,

        Long capacity
) {

    public EducationCreateRequest {
        if(educationDate == null || place == null || title == null || content == null || capacity == null) throw new RequiredValueMissingException();

        if(place.isBlank() || title.isBlank() || content.isBlank()) throw new BlankValueNotAllowedException();

        if(capacity <= 0) throw new PositiveValueRequiredException();

    }
}
