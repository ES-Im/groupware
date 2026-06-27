package com.haruon.groupware.application.auth.service.command.dto;

public record JwtResponse(
        String accessToken,
        String refreshToken
) {}
