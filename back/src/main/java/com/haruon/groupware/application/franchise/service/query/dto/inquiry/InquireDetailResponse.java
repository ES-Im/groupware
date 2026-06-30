package com.haruon.groupware.application.franchise.service.query.dto.inquiry;

import java.time.LocalDateTime;

public record InquireDetailResponse(
        Long inquiryId,
        String externalId,

        Long franchiseId,
        String franchiseName,
        String inquirerContact,
        LocalDateTime inquiryAt,
        String inquiryTitle,
        String inquiryContent,

        Long assignedManagerId,
        String assignedManagerName,

        Boolean isDeleted
) {
}
