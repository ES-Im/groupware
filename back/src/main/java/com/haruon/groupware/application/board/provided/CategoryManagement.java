package com.haruon.groupware.application.board.provided;

public interface CategoryManagement {

    long registerCategory(Long editorId, String categoryName);

    void changeCategoryName(Long editorId, Long categoryId, String categoryName);

    void showCategory(Long editorId, Long categoryId);

    void hideCategory(Long editorId, Long categoryId);
}
