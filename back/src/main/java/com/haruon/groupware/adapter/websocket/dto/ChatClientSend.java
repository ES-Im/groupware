package com.haruon.groupware.adapter.websocket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * 클라이언트 Request JSON BODY
 */
public record ChatClientSend(
        @NotNull UUID clientMessageId,
        @NotBlank @Size(max = 2000) String content
) {
}
