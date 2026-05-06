package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.board.Category;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.application.board.provided.BoardFixture.getSavedCategory;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

@TestIntegrationConfig
record CategoryManagementTest(
        CategoryManagement categoryManagement,
        CategoryRepository categoryRepository,
        EmpRepository empRepository
) {

    @AfterEach
    void tearDown() {
        categoryRepository.deleteAll();
        empRepository.deleteAll();
    }


    @Test
    @DisplayName("ADMIN 권한을 가진 사원이라면, 카테고리를 생성할 수 있다.")
    void registerCategory_success() {
        Emp admin = saveAdmin(empRepository);

        String name = "test";
        long categoryId = categoryManagement.registerCategory(admin.getId(), name);

        Category category = categoryRepository.findById(categoryId).orElseThrow();

        assertEquals(name, category.getName());

        assertThat(category.isVisible())
                .as("카테고리 생성시, 활성화 여부는 true")
                .isTrue();
    }

    @Test
    @DisplayName("ADMIN 권한이 없는 사원이라면, 카테고리 생성을 하지 못한다.")
    void register_category_by_not_admin_fail() {
        Emp emp = saveApprovedEmp(empRepository);

        assertThatThrownBy(() ->
                categoryManagement.registerCategory(emp.getId(), "test")
        ).hasMessage("권한이 없습니다.");
    }

    @Test
    @DisplayName("ADMIN 권한을 가진 사원이라면, 카테고리명을 수정 할 수 있다.")
    void changeCategoryName_success() {
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "test");

        String editedName = "edited";
        categoryManagement.changeCategoryName(admin.getId(), categoryId, editedName);

        Category category = categoryRepository.findById(categoryId).orElseThrow();
        assertEquals(editedName, category.getName());
    }


    @Test
    @DisplayName("admin 권한이 없다면, 카테고리 수정을 하지 못한다.")
    void update_category_by_not_admin_fail() {
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "test");

        Emp normalEmp = saveApprovedEmp(empRepository, "202601101", "normalEmp");

        assertThatThrownBy(() ->
                categoryManagement.changeCategoryName(normalEmp.getId(), categoryId, "editedName")
        ).hasMessage("권한이 없습니다.");
    }

    @Test
    void hideCategory() {
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "test");

        categoryManagement.hideCategory(admin.getId(), categoryId);
        Category category = categoryRepository.findById(categoryId).orElseThrow();
        assertThat(category.isVisible()).isFalse();
    }

    @Test
    void showCategory() {
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "test");

        categoryManagement.hideCategory(admin.getId(), categoryId);
        categoryManagement.showCategory(admin.getId(), categoryId);

        Category category = categoryRepository.findById(categoryId).orElseThrow();
        assertThat(category.isVisible()).isTrue();
    }

}