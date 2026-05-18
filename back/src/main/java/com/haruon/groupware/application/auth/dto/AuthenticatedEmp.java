package com.haruon.groupware.application.auth.dto;

import java.util.List;

public record AuthenticatedEmp(
        String loginId,
        List<String> roles
) {
}
