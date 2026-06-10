package com.haruon.groupware.application.board.service.dto.response;

public record CategoryResponse(
        Long categoryId,
        String categoryName,
        boolean isVisible
) {
}
