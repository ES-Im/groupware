package com.haruon.groupware.application.franchise.service.query.dto.education;

import java.time.LocalDate;

public record EducationsResponse(
        Long id,
        LocalDate date,
        String place,
        String title,
        Boolean isFull,
        Boolean isActive
) {
}
