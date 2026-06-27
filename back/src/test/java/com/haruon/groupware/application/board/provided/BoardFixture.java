package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.board.provided.forCommand.BoardManagement;
import com.haruon.groupware.application.board.provided.forCommand.CategoryManagement;
import com.haruon.groupware.application.board.service.command.dto.BoardCreateRequest;
import com.haruon.groupware.domain.employee.Emp;

import java.time.LocalDateTime;

public class BoardFixture {

    static long getSavedCategory(CategoryManagement categoryManagement, Emp admin, String name) {
        return categoryManagement.registerCategory(admin.getId(), name);
    }

    static long getUnPublishedBoard(
            BoardManagement boardManagement,
            Emp author,
            long categoryId
    ) {
        return boardManagement.registerBoard(
                author.getId(),
                BoardCreateRequest.builder()
                        .categoryId(categoryId)
                        .title("title")
                        .content("content")
                .build()
        );
    }

    static long getPublishedBoard(
            BoardManagement boardManagement,
            Emp author,
            long categoryId
    ) {
        return boardManagement.registerBoard(
                author.getId(),
                BoardCreateRequest.builder()
                        .categoryId(categoryId)
                        .title("title")
                        .content("content")
                        .publishedAt(LocalDateTime.of(2026, 3, 1, 0, 0, 0))
                .build()
        );
    }


}
