package com.haruon.groupware.application.franchise.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static org.springframework.util.Assert.state;

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
        state(educationDate != null
                        || place != null
                        || title != null
                        || content != null
                        || capacity != null,
                "변경할 내용이 없음"
        );

        if(place != null) state(!place.isBlank(), "교육 장소는 비어 있을 수 없음");
        if(title != null) state(!title.isBlank(), "교육 제목은 비어 있을 수 없음");
        if(content != null) state(!content.isBlank(), "교육 내용은 비어 있을 수 없음");
        if(capacity != null) state(capacity > 0, "수용인원은 0보다 커야 함");
    }
}
