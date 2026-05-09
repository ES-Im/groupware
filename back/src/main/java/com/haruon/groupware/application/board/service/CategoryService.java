package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.provided.CategoryManagement;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.board.Category;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.board.service.BoardUtils.findCategory;
import static com.haruon.groupware.application.utils.AuthorizationChecker.checkAdminById;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService implements CategoryManagement {

    private final EmpRepository empRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public long registerCategory(Long editorId, String categoryName) {
        checkAdminById(empRepository, editorId);

        Category category = Category.create(categoryName);

        return categoryRepository.save(category).getId();
    }

    @Override
    public void changeCategoryName(Long editorId, Long categoryId, String categoryName) {
        checkAdminById(empRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeCategoryName(categoryName);
    }


    @Override
    public void showCategory(Long editorId, Long categoryId) {
        checkAdminById(empRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeVisibility(true);
    }

    @Override
    public void hideCategory(Long editorId, Long categoryId) {
        checkAdminById(empRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeVisibility(false);
    }

}
