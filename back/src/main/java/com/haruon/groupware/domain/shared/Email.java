package com.haruon.groupware.domain.shared;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN_MESSAGE;

@Embeddable
public record Email(
        @Size(max = 150)
        @Pattern(
                regexp = EMAIL_PATTERN,
                message = EMAIL_PATTERN_MESSAGE
        )
        String email
) {

    public static Email of(String loginId, String companyDomain) {
        String newEmail = loginId + "@" + companyDomain;
        return new Email(newEmail);
    }
}
