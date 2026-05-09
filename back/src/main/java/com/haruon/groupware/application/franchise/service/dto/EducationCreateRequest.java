package com.haruon.groupware.application.franchise.service.dto;

import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record EducationCreateRequest(

        LocalDateTime educationDate,

        String place,

        String title,

        String content,

        Long capacity
) {

    public EducationCreateRequest {
        requireNonNull(educationDate);
        requireNonNull(place);
        requireNonNull(title);
        requireNonNull(content);
        requireNonNull(capacity);

        state(!place.isBlank(), "교육 장소는 비어 있을 수 없음");
        state(!title.isBlank(), "교육 제목은 비어 있을 수 없음");
        state(!content.isBlank(), "교육 내용은 비어 있을 수 없음");
        state(capacity > 0, "수용인원은 0보다 커야 함");

    }
}
