package com.haruon.groupware.application.franchise.service.query.dto.education;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EducationsResponse(
        Long id,
        LocalDate date,
        String place,
        String title,
        Boolean isFull,
        Boolean isActive
) {
    public EducationsResponse(
            Long id,
            LocalDateTime date,
            String place,
            String title,
            Boolean isFull,
            Boolean isActive
    ) {
        this(id, date.toLocalDate(), place, title, isFull, isActive);
    }
}
