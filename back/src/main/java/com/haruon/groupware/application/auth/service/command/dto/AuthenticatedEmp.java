package com.haruon.groupware.application.auth.service.command.dto;

import java.util.List;

public record AuthenticatedEmp(
        String loginId,
        List<String> roles
) {
}
