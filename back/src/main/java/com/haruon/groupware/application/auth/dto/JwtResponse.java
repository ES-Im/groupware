package com.haruon.groupware.application.auth.dto;

public record JwtResponse(
        String accessToken,
        String refreshToken
) {}
