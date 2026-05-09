package com.haruon.groupware.domain.board;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CategoryTest {

    @Test
    @DisplayName("카테고리 생성 테스트 - 생성시, 활성화여부는 true이다.")
    void create_success() {
        String name = "test";

        Category category = Category.create(name);

        assertEquals(name, category.getName());
        assertTrue(category.isVisible());
    }

    @Test
    @DisplayName("카테고리명은 변경할 수 있다.")
    void changeCategoryName_success() {
        String name = "test";
        Category category = Category.create(name);
        String newName = "newTest";
        category.changeCategoryName(newName);

        assertEquals(newName, category.getName());
    }

    @Test
    @DisplayName("카테고리 숨기기 여부는 변경할 수 있다.")
    void changeVisibility_success() {
        String name = "test";
        Category category = Category.create(name);
        category.changeVisibility(false);

        assertFalse(category.isVisible());
    }
}