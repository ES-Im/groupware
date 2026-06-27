package com.haruon.groupware.application.board.service.query.dto;

public record CategoryResponse(
        Long categoryId,
        String categoryName,
        boolean isVisible
) {
}
