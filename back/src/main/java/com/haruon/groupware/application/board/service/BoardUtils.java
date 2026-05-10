package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.exception.board.ActiveCategoryNotFoundException;
import com.haruon.groupware.application.exception.board.BoardNotFoundException;
import com.haruon.groupware.application.exception.board.CategoryNotFoundException;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.Category;

public class BoardUtils {


    static Category findCategory(CategoryRepository categoryRepository, Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(CategoryNotFoundException::new);
    }

    static Category findVisableCategory(CategoryRepository categoryRepository, Long categoryId) {
        Category category = findCategory(categoryRepository, categoryId);

        if(!category.isVisible()) throw new ActiveCategoryNotFoundException();

        return category;
    }

    static Board findBoard(BoardRepository boardRepository, Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(BoardNotFoundException::new);
    }
}
