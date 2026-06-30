package com.haruon.groupware.application.franchise.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.franchise.InquiryType;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record InquiryRequest(
        String externalId,

        String inquirerContact,

        LocalDateTime inquiryAt,

        String inquiryTitle,

        String inquiryContent,

        InquiryType type
) {
    public InquiryRequest {
        if(externalId == null || inquirerContact == null || inquiryAt == null || inquiryTitle == null || inquiryContent == null) throw new RequiredValueMissingException();

        if(externalId.isBlank()) throw new BlankValueNotAllowedException();
        if(inquirerContact.isBlank()) throw new BlankValueNotAllowedException();
        if(inquiryTitle.isBlank()) throw new BlankValueNotAllowedException();
        if(inquiryContent.isBlank()) throw new BlankValueNotAllowedException();
    }
}
