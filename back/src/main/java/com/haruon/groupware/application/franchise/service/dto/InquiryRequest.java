package com.haruon.groupware.application.franchise.service.dto;

import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record InquiryRequest(
        String externalId,

        String inquirerContact,

        LocalDateTime inquiryAt,

        String inquiryTitle,

        String inquiryContent
) {
    public InquiryRequest {
        requireNonNull(externalId);
        requireNonNull(inquirerContact);
        requireNonNull(inquiryAt);
        requireNonNull(inquiryTitle);
        requireNonNull(inquiryContent);

        state(!externalId.isBlank(), "외부 식별자는 공백이 될 수 없음");
        state(!inquirerContact.isBlank(), "질의자의 연락처는 공백이 될 수 없음");
        state(!inquiryTitle.isBlank(), "문의 제목은 공백이 될 수 없음");
        state(!inquiryContent.isBlank(), "문의 내용은 공백이 될 수 없음");

    }
}
