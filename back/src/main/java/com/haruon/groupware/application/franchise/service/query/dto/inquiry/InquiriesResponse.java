package com.haruon.groupware.application.franchise.service.query.dto.inquiry;

import java.time.LocalDateTime;

public record InquiriesResponse(
        Long inquiryId,
        String externalId,
        Long franchiseId,
        String franchiseName,
        String inquiryTitle,
        LocalDateTime inquiryAt,
        Boolean isAnswered,
        Long assignedManagerId,
        String assignedManagerName
) {
}
