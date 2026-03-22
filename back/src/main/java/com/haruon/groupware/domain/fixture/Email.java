package com.haruon.groupware.domain.fixture;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record Email(
        @Size(max = 150)
        @Pattern(
                regexp = "^[a-zA-Z0-9_+&*-]+(?:\\\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\\\.)+[a-zA-Z]{2,7}$",
                message = "이메일 형식이 올바르지 않습니다."
        )
        String email
) {}
