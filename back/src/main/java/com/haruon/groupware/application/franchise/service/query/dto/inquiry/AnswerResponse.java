package com.haruon.groupware.application.franchise.service.query.dto.inquiry;

import java.time.LocalDateTime;

public record AnswerResponse(
        Long answerId,
        String content,
        Boolean isSubmitted,
        LocalDateTime answeredAt,

        Long answeredEmpId,
        String answeredEmpName
) {
}
