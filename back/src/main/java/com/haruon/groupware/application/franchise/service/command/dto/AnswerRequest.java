package com.haruon.groupware.application.franchise.service.command.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerRequest(
       @NotBlank String answer
) {
}
