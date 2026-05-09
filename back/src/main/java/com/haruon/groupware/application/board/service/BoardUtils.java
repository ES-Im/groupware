package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.Category;

//todo - 커스텀 예외처리 필요
public class BoardUtils {


    static Category findCategory(CategoryRepository categoryRepository, Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalStateException("조회된 카테고리가 없음"));
    }

    static Category findVisableCategory(CategoryRepository categoryRepository, Long categoryId) {
        Category category = findCategory(categoryRepository, categoryId);

        if(!category.isVisible()) throw new IllegalStateException("활성화된 카테고리가 아님");

        return category;
    }

    static Board findBoard(BoardRepository boardRepository, Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalStateException("조회된 게시글이 없음"));
    }
}
