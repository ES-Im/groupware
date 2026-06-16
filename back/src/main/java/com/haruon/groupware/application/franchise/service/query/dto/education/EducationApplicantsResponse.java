package com.haruon.groupware.application.franchise.service.query.dto.education;

import java.time.LocalDateTime;

public record EducationApplicantsResponse(
        Long applicationId,
        String externalId,

        Long franchiseId,
        String franchiseName,
        String contactNumber,
        String contactEmail,

        Long appliedCount,
        LocalDateTime appliedAt
) {

}
