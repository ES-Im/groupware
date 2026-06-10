package com.haruon.groupware.adapter.webapi.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommandCommentRequest(
        @NotBlank @Size(max = 300) String content
) {
}
