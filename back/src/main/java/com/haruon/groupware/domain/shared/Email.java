package com.haruon.groupware.domain.shared;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN_MESSAGE;

public record Email(
        @Size(max = 150)
        @Pattern(
                regexp = EMAIL_PATTERN,
                message = EMAIL_PATTERN_MESSAGE
        )
        String email
) {}
